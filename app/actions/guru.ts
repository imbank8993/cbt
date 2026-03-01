"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Mendapatkan ID Organisasi untuk user Guru yang sedang login
 */
export async function getGuruOrganization(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
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
    return null;
}

/**
 * Mendapatkan daftar kelas yang diajar/dimiliki oleh guru
 * Saat ini mengambil semua kelas tambahan di org jika guru berhak (ini bisa disesuaikan dengan kebutuhan kepemilikan kelas)
 */
export async function listGuruClasses(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    // Untuk sederhana, kita ambil kelas tambahan saja di organisasi tersebut 
    // Idealnya ada tabel class_teachers jika guru spesifik
    const { data, error } = await supabaseAdmin
        .from('classes')
        .select(`
            *,
            class_members (count)
        `)
        .eq('organization_id', orgId)
        .eq('type', 'tambahan')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Guru: Class list error:', error);
        return [];
    }

    return data.map((c: any) => ({
        ...c,
        studentCount: c.class_members?.[0]?.count || 0
    }));
}

/**
 * Membuat kelas tambahan baru (Guru hanya bisa membuat kelas tambahan)
 */
export async function createTambahanClassAction(orgId: string, name: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data, error } = await supabaseAdmin
            .from('classes')
            .insert({ organization_id: orgId, name, type: 'tambahan', join_code: joinCode })
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/dashboard/guru/classes');
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Menambahkan siswa ke kelas tambahan (Guru)
 */
export async function assignStudentToClassGuruAction(userId: string, classId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('class_members')
            .upsert({ class_id: classId, user_id: userId });

        if (error) throw error;
        revalidatePath('/dashboard/guru/classes');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Mendapatkan daftar siswa di organisasi untuk ditambahkan
 */
export async function listOrganizationStudentsForGuru(orgId: string) {
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
        console.error('Guru: Student list error:', error);
        return [];
    }

    // Fetch emails from auth.users
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const emailMap = new Map();
    if (authData?.users) {
        authData.users.forEach(u => emailMap.set(u.id, u.email));
    }

    return data.map((m: any) => ({
        userId: m.user_id,
        fullName: m.profiles?.full_name || 'No Name',
        email: emailMap.get(m.user_id) || '-'
    }));
}

/**
 * Mendapatkan detail jawaban siswa (khususnya uraian) untuk dinilai manual
 */
export async function getAttemptDetailsForGrading(attemptId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: attempt, error: attemptError } = await supabaseAdmin
        .from('exam_attempts')
        .select(`
            id, total_score, status, needs_manual_grading,
            profiles(full_name),
            exams(title)
        `)
        .eq('id', attemptId)
        .single();

    if (attemptError || !attempt) return null;

    const { data: answers, error: answersError } = await supabaseAdmin
        .from('answers')
        .select(`
            id, essay_answer, score,
            bank_questions(id, question, type, score_default)
        `)
        .eq('attempt_id', attemptId)
        .in('bank_questions.type', ['essay', 'esay', 'uraian']);

    if (answersError) return null;

    // Filter only essays
    const essayAnswers = answers.filter(a => a.bank_questions !== null);

    return {
        attempt,
        essayAnswers
    };
}

/**
 * Menyimpan nilai uraian yang diberikan guru dan mengupdate total skor
 */
export async function submitEssayGradesAction(attemptId: string, grades: Record<string, number>) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Dapatkan attempt dengan exam_id
        const { data: attempt, error: attemptError } = await supabaseAdmin
            .from('exam_attempts')
            .select('exam_id')
            .eq('id', attemptId)
            .single();

        if (attemptError || !attempt) throw attemptError;

        let examId = attempt.exam_id;

        // 2. Dapatkan qbId untuk menghitung max score
        const { data: exam } = await supabaseAdmin.from('exams').select('question_bank_id').eq('id', examId).single();
        let qbId = exam?.question_bank_id;
        if (!qbId) {
            const { data: sources } = await supabaseAdmin.from('exam_question_sources').select('bank_id').eq('exam_id', examId).limit(1);
            if (sources && sources.length > 0) qbId = sources[0].bank_id;
        }

        if (!qbId) return { success: false, error: 'Question Bank error' };

        // 3. Update masing-masing nilai jawaban uraian
        for (const [answerId, score] of Object.entries(grades)) {
            await supabaseAdmin.from('answers').update({ score: score, is_correct: score > 0 }).eq('id', answerId);
        }

        // 4. Kalkulasi ulang total score
        const { data: questions } = await supabaseAdmin.from('bank_questions').select('id, score_default').eq('bank_id', qbId);
        let maxScore = 0;
        questions?.forEach(q => maxScore += (q.score_default || 1));

        const { data: allAnswers } = await supabaseAdmin.from('answers').select('score').eq('attempt_id', attemptId);
        let finalScore = 0;
        allAnswers?.forEach(a => finalScore += (a.score || 0));

        const finalScore100 = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

        // 5. Update exam_attempt
        await supabaseAdmin.from('exam_attempts').update({
            total_score: finalScore100,
            needs_manual_grading: false
        }).eq('id', attemptId);

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
