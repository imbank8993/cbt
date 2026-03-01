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

    // 3. Fallback for Platform Admins: give them the first org available
    if (adminUser) {
        const { data: firstOrg } = await supabaseAdmin.from('organizations').select('id, name').limit(1).maybeSingle();
        if (firstOrg) {
            return {
                id: firstOrg.id,
                name: firstOrg.name + ' (Admin View)'
            };
        }
    }

    return null;
}

/**
 * Mendapatkan statistik ringkas organisasi
 */
export async function getOrganizationStats(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const [membersCount, examsCount, activeAttempts] = await Promise.all([
            supabaseAdmin.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
            supabaseAdmin.from('exams').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
            supabaseAdmin.from('exam_attempts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'in_progress')
        ]);

        return {
            totalMembers: membersCount.count || 0,
            totalExams: examsCount.count || 0,
            activeAttempts: activeAttempts.count || 0
        };
    } catch (error) {
        console.error('Proctor: Stats fetch error:', error);
        return { totalMembers: 0, totalExams: 0, activeAttempts: 0 };
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
            profiles (
                full_name,
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
        fullName: m.profiles?.full_name || 'No Name',
        email: emailMap.get(m.user_id) || '-',
        role: (m.member_roles as any)?.[0]?.roles?.name || 'Siswa',
        classes: (m.profiles?.class_members as any)?.map((cm: any) => cm.classes) || []
    }));
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
export async function inviteMemberAction(orgId: string, email: string, fullName: string, roleName: 'Guru' | 'Siswa' | 'Pengawas', password: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: roleName
            }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Create Profile
        await supabaseAdmin.from('profiles').upsert({ id: userId, full_name: fullName });

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
    questionBankId?: string;
}) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
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
export async function importMembersAction(orgId: string, members: { fullName: string; email: string; role: 'Guru' | 'Siswa' | 'Pengawas'; password: string }[]) {
    const results = {
        successCount: 0,
        failedCount: 0,
        errors: [] as { email: string; error: string }[]
    };

    for (const member of members) {
        try {
            const result = await inviteMemberAction(orgId, member.email, member.fullName, member.role, member.password);
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
