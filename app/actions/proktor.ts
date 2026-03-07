"use server";
import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

import { cookies } from 'next/headers';

/**
 * Mendapatkan ID Organisasi untuk user Proktor yang sedang login
 */
export async function getProctorOrganization(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const cookieStore = await cookies();
    const managedOrgId = cookieStore.get('managed_org_id')?.value;

    // 1. Check if Platform Admin is in "Managed Mode"
    const { data: adminUser } = await supabaseAdmin.from('platform_admins').select('id').eq('id', userId).maybeSingle();

    if (adminUser && managedOrgId) {
        const { data: managedOrg } = await supabaseAdmin
            .from('organizations')
            .select('id, name')
            .eq('id', managedOrgId)
            .maybeSingle();

        if (managedOrg) {
            return {
                id: managedOrg.id,
                name: managedOrg.name,
                isManaged: true
            };
        }
    }

    // 2. Check if user is an organization member
    const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('organization_id, organizations(name)')
        .eq('user_id', userId)
        .maybeSingle();

    if (member) {
        return {
            id: member.organization_id,
            name: (member.organizations as any)?.name
        };
    }

    // 3. Fallback: return null if not member and no managed_org_id
    return null;
}

/**
 * Mendapatkan statistik ringkas organisasi
 */
export async function getOrganizationStats(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    try {
        const [membersCount, banksCount, exams] = await Promise.all([
            supabaseAdmin.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
            supabaseAdmin.from('question_banks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
            supabaseAdmin.from('exams').select('status, start_time, end_time').eq('organization_id', orgId)
        ]);

        const examsData = exams.data || [];

        const ongoing = examsData.filter(e =>
            e.status === 'active' &&
            (!e.start_time || e.start_time <= now) &&
            (!e.end_time || e.end_time >= now)
        ).length;

        const upcoming = examsData.filter(e =>
            e.status === 'active' &&
            e.start_time && e.start_time > now
        ).length;

        const finished = examsData.filter(e =>
            e.status === 'finished' ||
            (e.status === 'active' && e.end_time && e.end_time < now)
        ).length;

        return {
            totalMembers: membersCount.count || 0,
            totalBanks: banksCount.count || 0,
            ongoingExams: ongoing,
            upcomingExams: upcoming,
            finishedExams: finished
        };
    } catch (error) {
        console.error('Proctor: Stats fetch error:', error);
        return { totalMembers: 0, totalBanks: 0, ongoingExams: 0, upcomingExams: 0, finishedExams: 0 };
    }
}

/**
 * Mendapatkan daftar anggota organisasi
 */
export async function listOrganizationMembers(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('organization_members')
        .select(`
            id,
            user_id,
            is_active,
            profiles (
                full_name,
                identity_number,
                class_members (
                    classes (id, name, type)
                )
            ),
            member_roles (
                roles (name)
            )
        `)
        .eq('organization_id', orgId);

    if (error) {
        console.error('Proctor: Member list error:', error);
        return [];
    }

    // Fetch emails from auth.users
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const emailMap = new Map();
    if (authData?.users) {
        authData.users.forEach(u => emailMap.set(u.id, u.email));
    }

    return data.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        is_active: m.is_active ?? true,
        fullName: m.profiles?.full_name || 'No Name',
        identityNumber: m.profiles?.identity_number || '-',
        email: emailMap.get(m.user_id) || '-',
        role: (m.member_roles as any)?.[0]?.roles?.name || 'Siswa',
        classes: (m.profiles?.class_members as any)?.map((cm: any) => cm.classes) || []
    }));
}

/**
 * Toggle member active status
 */
export async function toggleMemberStatusAction(memberId: string, isActive: boolean) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('organization_members')
            .update({ is_active: isActive })
            .eq('id', memberId);

        if (error) throw error;
        revalidatePath('/dashboard/proktor/members');
        return { success: true };
    } catch (error: any) {
        console.error('Proctor: Toggle status error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mendapatkan daftar ujian yang akan datang/berjalan
 */
export async function listOrganizationExams(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('exams')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Proctor: Exams list error:', error);
        return [];
    }

    return data;
}

/**
 * Invite/Create new member for the organization
 */
export async function inviteMemberAction(orgId: string, email: string, fullName: string, roleName: 'Guru' | 'Siswa' | 'Pengawas', password: string, identityNumber?: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: roleName,
                identity_number: identityNumber
            }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Create Profile
        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            identity_number: identityNumber
        });

        // 3. Add to Organization
        const { data: member, error: mErr } = await supabaseAdmin
            .from('organization_members')
            .insert({ organization_id: orgId, user_id: userId, is_active: true })
            .select()
            .single();

        if (mErr) throw mErr;

        // 4. Assign Role
        const { data: role } = await supabaseAdmin.from('roles').select('id').eq('name', roleName).single();
        if (role) {
            await supabaseAdmin.from('member_roles').insert({
                organization_member_id: member.id,
                role_id: role.id
            });
        }

        revalidatePath('/dashboard/proktor/members');
        return { success: true };
    } catch (error: any) {
        console.error('Proctor: Invite error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Create a new exam
 */
export async function createExamAction(data: {
    orgId: string;
    title: string;
    description?: string;
    duration: number;
    startTime?: string;
    endTime?: string;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    showResults?: boolean;
    isSafeMode?: boolean;
    questionBankId?: string;
}) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // Validation: Ensure the question bank is published
        if (data.questionBankId) {
            const { data: bank } = await supabaseAdmin
                .from('question_banks')
                .select('is_published')
                .eq('id', data.questionBankId)
                .single();

            if (!bank?.is_published) {
                return { success: false, error: 'Bank soal harus diterbitkan (Published) sebelum bisa digunakan untuk ujian.' };
            }
        }

        const { data: exam, error } = await supabaseAdmin
            .from('exams')
            .insert({
                organization_id: data.orgId,
                question_bank_id: data.questionBankId,
                title: data.title,
                description: data.description,
                duration_minutes: data.duration,
                start_time: data.startTime,
                end_time: data.endTime,
                randomize_questions: data.randomizeQuestions ?? true,
                randomize_options: data.randomizeOptions ?? true,
                show_results: data.showResults ?? false,
                metadata: {
                    is_safe_mode: data.isSafeMode ?? true
                },
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/dashboard/guru/exams');
        revalidatePath('/dashboard/proktor/exams');
        return { success: true, id: exam.id };
    } catch (error: any) {
        console.error('Proctor: Create exam error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mendapatkan daftar kelas di organisasi
 */
export async function listOrganizationClasses(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('classes')
        .select(`
            *,
            class_members (count)
        `)
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Proctor: Class list error:', error);
        return [];
    }

    return data.map((c: any) => ({
        ...c,
        studentCount: c.class_members?.[0]?.count || 0
    }));
}

/**
 * Membuat kelas baru
 */
export async function createClassAction(orgId: string, name: string, type: 'reguler' | 'tambahan') {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // Generate random 6 character alphanumeric join_code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data, error } = await supabaseAdmin
            .from('classes')
            .insert({ organization_id: orgId, name, type, join_code: joinCode })
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/dashboard/proktor/members');
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Menambahkan siswa ke kelas
 */
export async function assignStudentToClassAction(userId: string, classId: string, type: 'reguler' | 'tambahan') {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // Jika reguler, hapus keanggotaan reguler lama (karena hanya boleh 1)
        if (type === 'reguler') {
            const { data: oldRegClass } = await supabaseAdmin
                .from('class_members')
                .select('id, classes!inner(type)')
                .eq('user_id', userId)
                .eq('classes.type', 'reguler')
                .maybeSingle();

            if (oldRegClass) {
                await supabaseAdmin.from('class_members').delete().eq('id', oldRegClass.id);
            }
        }

        const { error } = await supabaseAdmin
            .from('class_members')
            .upsert({ class_id: classId, user_id: userId });

        if (error) throw error;
        revalidatePath('/dashboard/proktor/members');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Assign exam to classes and/or specific users, and set status
 */
export async function assignExamAction(examId: string, classIds: string[], userIds: string[], activate: boolean = true) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        await supabaseAdmin.from('exam_targets').delete().eq('exam_id', examId);
        await supabaseAdmin.from('exam_participants').delete().eq('exam_id', examId);

        if (classIds && classIds.length > 0) {
            const targets = classIds.map(cid => ({ exam_id: examId, class_id: cid }));
            const { error: tErr } = await supabaseAdmin.from('exam_targets').insert(targets);
            if (tErr) throw tErr;
        }

        if (userIds && userIds.length > 0) {
            const participants = userIds.map(uid => ({ exam_id: examId, user_id: uid }));
            const { error: pErr } = await supabaseAdmin.from('exam_participants').insert(participants);
            if (pErr) throw pErr;
        }

        if (activate) {
            const { error: statusErr } = await supabaseAdmin.from('exams').update({ status: 'active' }).eq('id', examId);
            if (statusErr) throw statusErr;
        }

        revalidatePath('/dashboard/guru/exams');
        revalidatePath('/dashboard/proktor/exams');
        return { success: true };
    } catch (error: any) {
        console.error('Proctor: Assign exam error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update exam details
 */
export async function editExamAction(examId: string, data: {
    title: string;
    description?: string;
    duration: number;
    startTime?: string;
    endTime?: string;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    showResults?: boolean;
    isSafeMode?: boolean;
}) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('exams')
            .update({
                title: data.title,
                description: data.description,
                duration_minutes: data.duration,
                start_time: data.startTime || null,
                end_time: data.endTime || null,
                randomize_questions: data.randomizeQuestions ?? true,
                randomize_options: data.randomizeOptions ?? true,
                show_results: data.showResults ?? false,
                metadata: {
                    is_safe_mode: data.isSafeMode ?? true
                }
            })
            .eq('id', examId);
        if (error) throw error;
        revalidatePath('/dashboard/guru/exams');
        revalidatePath('/dashboard/proktor/exams');
        return { success: true };
    } catch (error: any) {
        console.error('Proctor: Edit exam error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Import many members in bulk
 */
export async function importMembersAction(orgId: string, members: { fullName: string; email: string; role: 'Guru' | 'Siswa' | 'Pengawas'; password: string; identityNumber?: string }[]) {
    const results = {
        successCount: 0,
        failedCount: 0,
        errors: [] as { email: string; error: string }[]
    };

    for (const member of members) {
        try {
            const result = await inviteMemberAction(orgId, member.email, member.fullName, member.role, member.password, member.identityNumber);
            if (result.success) {
                results.successCount++;
            } else {
                results.failedCount++;
                results.errors.push({ email: member.email, error: result.error || 'Unknown error' });
            }
        } catch (error: any) {
            results.failedCount++;
            results.errors.push({ email: member.email, error: error.message || 'Exception occurred' });
        }
    }

    revalidatePath('/dashboard/proktor/members');
    return results;
}

/**
 * Mendapatkan daftar siswa di organisasi
 */
export async function listOrganizationStudents(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('organization_members')
        .select(`
            user_id,
            profiles (
                full_name
            ),
            member_roles!inner (
                roles!inner (name)
            )
        `)
        .eq('organization_id', orgId)
        .eq('member_roles.roles.name', 'Siswa');

    if (error) {
        console.error('Proctor: Student list error:', error);
        return [];
    }

    return data.map((m: any) => ({
        id: m.user_id,
        fullName: m.profiles?.full_name || 'No Name'
    }));
}

/**
 * Mendapatkan daftar percobaan ujian (attempts) untuk suatu ujian
 */
export async function getExamAttemptsAction(examId: string) {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
        .from('exam_attempts')
        .select(`
            id,
            status,
            total_score,
            needs_manual_grading,
            started_at,
            finished_at,
            profiles (
                full_name,
                email
            )
        `)
        .eq('exam_id', examId)
        .order('finished_at', { ascending: false });

    if (error) {
        console.error('Proctor: Get exam attempts error:', error);
        return [];
    }

    return data || [];
}

/**
 * Mendapatkan semua jawaban dari suatu percobaan ujian untuk Analisis Butir Soal
 */
export async function getExamAnswersForAnalysisAction(examId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    // Cari semua attempts untuk ujian ini
    const { data: attempts, error: attError } = await supabaseAdmin
        .from('exam_attempts')
        .select('id')
        .eq('exam_id', examId);

    if (attError || !attempts) return [];

    const attemptIds = attempts.map(a => a.id);
    if (attemptIds.length === 0) return [];

    const { data: answers, error: ansError } = await supabaseAdmin
        .from('answers')
        .select(`
            question_id,
            is_correct,
            bank_questions (
                question_text
            )
        `)
        .in('attempt_id', attemptIds);

    if (ansError) {
        console.error('Proctor: Get answers error:', ansError);
        return [];
    }

    return answers || [];
}

/**
 * Mendapatkan detail lengkap satu pengerjaan ujian (Attempt) untuk Analytics
 */
export async function getAttemptFullDetailsAction(attemptId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Ambil data attempt, profil, dan info ujian
        const { data: attempt, error: attemptError } = await supabaseAdmin
            .from('exam_attempts')
            .select(`
                *,
                profiles (full_name),
                exams (*)
            `)
            .eq('id', attemptId)
            .single();

        if (attemptError || !attempt) throw attemptError;

        // Fetch email manually from auth if needed, but profiles usually has it if synced
        // If profile doesn't have email, we can try getting it from auth admin
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(attempt.user_id);
        const email = userData?.user?.email || '-';

        // 2. Ambil semua jawaban beserta detail soal dan pilihannya
        const { data: answers, error: answersError } = await supabaseAdmin
            .from('answers')
            .select(`
                *,
                bank_questions (
                    *,
                    bank_question_options (*)
                )
            `)
            .eq('attempt_id', attemptId);

        if (answersError) throw answersError;

        // 3. Ambil log keamanan
        const { data: securityLogs, error: logsError } = await supabaseAdmin
            .from('attempt_security_logs')
            .select('*')
            .eq('attempt_id', attemptId)
            .order('created_at', { ascending: true });

        return {
            attempt: {
                ...attempt,
                email
            },
            answers: answers || [],
            securityLogs: securityLogs || []
        };
    } catch (error: any) {
        console.error('Proctor: Get full attempt details error:', error);
        return null;
    }
}
/**
 * Update member profile information (Name and Identity Number)
 * This is restricted for use by Proctors or Admins
 */
export async function updateMemberProfileAction(userId: string, data: { fullName?: string, identityNumber?: string }) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const updates: any = {};
        if (data.fullName !== undefined) updates.full_name = data.fullName;
        if (data.identityNumber !== undefined) updates.identity_number = data.identityNumber;

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        // Also update auth metadata for consistency
        const metadataUpdate: any = {};
        if (data.fullName) metadataUpdate.full_name = data.fullName;
        if (data.identityNumber) metadataUpdate.identity_number = data.identityNumber;

        if (Object.keys(metadataUpdate).length > 0) {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: metadataUpdate
            });
        }

        revalidatePath('/dashboard/proktor/members');
        return { success: true };
    } catch (error: any) {
        console.error('Proctor: Update member profile error:', error);
        return { success: false, error: error.message };
    }
}
