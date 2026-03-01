"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Mendapatkan daftar kelas yang diikuti oleh siswa
 */
export async function listStudentClasses(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('class_members')
        .select(`
            classes (
                id,
                name,
                type,
                organization_id,
                organizations (name)
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Siswa: Class list error:', error);
        return [];
    }

    return (data || []).map((cm: any) => {
        // Handle potential different join naming or structure
        const cls = cm.classes || cm.class_id;
        const actualCls = Array.isArray(cls) ? cls[0] : cls;

        if (!actualCls || typeof actualCls !== 'object') return null;

        // Handle organizations join (sometimes it comes as an array, sometimes object)
        const orgs = actualCls.organizations;
        const org = Array.isArray(orgs) ? orgs[0] : orgs;

        return {
            id: actualCls.id,
            name: actualCls.name,
            type: actualCls.type,
            orgName: org?.name || 'Sekolah'
        };
    }).filter(Boolean);
}

/**
 * Bergabung ke kelas menggunakan join_code
 */
export async function joinClassAction(userId: string, joinCode: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // Cari kelas berdasarkan join_code
        const { data: cls, error: findError } = await supabaseAdmin
            .from('classes')
            .select('id, name, type, organization_id')
            .eq('join_code', joinCode.toUpperCase())
            .maybeSingle();

        if (findError) throw findError;
        if (!cls) return { success: false, error: 'Kode kelas tidak valid atau tidak ditemukan.' };

        // Pastikan juga usernya ada di target organisasi
        // (optional, the schema could allow cross org but usually not)
        const { data: orgMember } = await supabaseAdmin
            .from('organization_members')
            .select('id')
            .eq('user_id', userId)
            .eq('organization_id', cls.organization_id)
            .maybeSingle();

        if (!orgMember) {
            return { success: false, error: 'Anda bukan anggota dari sekolah/organisasi kelas ini.' };
        }

        // Jika reguler, cek apakah siswa sudah punya kelas reguler
        if (cls.type === 'reguler') {
            const { data: existingReguler } = await supabaseAdmin
                .from('class_members')
                .select('id, classes!inner(type)')
                .eq('user_id', userId)
                .eq('classes.type', 'reguler')
                .maybeSingle();

            if (existingReguler) {
                return { success: false, error: 'Anda sudah terdaftar di Kelas Reguler lain. Hanya Proktor yang dapat memindahkan kelas reguler Anda.' };
            }
        }

        // Cek apakah sudah terdaftar di kelas yang dituju
        const { data: existingMember } = await supabaseAdmin
            .from('class_members')
            .select('id')
            .eq('class_id', cls.id)
            .eq('user_id', userId)
            .maybeSingle();

        if (existingMember) {
            return { success: false, error: 'Anda sudah terdaftar di kelas ini.' };
        }

        // Tambahkan ke kelas
        const { error: joinError } = await supabaseAdmin
            .from('class_members')
            .insert({ class_id: cls.id, user_id: userId });

        if (joinError) throw joinError;

        revalidatePath('/dashboard/siswa/classes');
        return { success: true, className: cls.name };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Mendapatkan daftar ujian untuk siswa berdasarkan kelas yang diikuti
 */
export async function getStudentExams(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Get student's classes
    const { data: classes } = await supabaseAdmin
        .from('class_members')
        .select('class_id')
        .eq('user_id', userId);

    const classIds = classes ? classes.map(c => c.class_id) : [];

    let examIdsFromClasses: string[] = [];
    if (classIds.length > 0) {
        // 2. Get exams targeted to these classes
        let { data: targets } = await supabaseAdmin
            .from('exam_targets')
            .select('exam_id')
            .in('class_id', classIds);

        if (targets) {
            examIdsFromClasses = targets.map(t => t.exam_id);
        }
    }

    // 2.5 Get exams explicitly assigned to this student
    const { data: participants } = await supabaseAdmin
        .from('exam_participants')
        .select('exam_id')
        .eq('user_id', userId);

    const examIdsFromParticipants = participants?.map(p => p.exam_id) || [];

    const examIds = [...new Set([...examIdsFromClasses, ...examIdsFromParticipants])];

    if (examIds.length === 0) return [];

    // 3. Get exam details
    const { data: exams, error } = await supabaseAdmin
        .from('exams')
        .select('*')
        .in('id', examIds)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Siswa: Get exams error:', error);
        return [];
    }

    // 4. Cek attempt status untuk ujian-ujian ini
    const { data: attempts } = await supabaseAdmin
        .from('exam_attempts')
        .select('exam_id, status')
        .eq('user_id', userId)
        .in('exam_id', examIds);

    const completedExamIds = new Set(
        attempts?.filter(a => a.status === 'submitted').map(a => a.exam_id) || []
    );

    return exams.map((ex: any) => ({
        ...ex,
        isCompleted: completedExamIds.has(ex.id)
    }));
}

/**
 * Menyubmit ujian, menghitung skor, dan menyimpan percobaan
 */
export async function submitExamAction(userId: string, examId: string, studentAnswers: Record<string, string>) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        // 1. Dapatkan info ujian
        const { data: exam, error: examError } = await supabaseAdmin
            .from('exams')
            .select('organization_id, question_bank_id')
            .eq('id', examId)
            .single();

        if (examError || !exam) return { success: false, error: 'Ujian tidak ditemukan' };

        let qbId = exam.question_bank_id;
        if (!qbId) {
            const { data: sources } = await supabaseAdmin.from('exam_question_sources').select('bank_id').eq('exam_id', examId).limit(1);
            if (sources && sources.length > 0) qbId = sources[0].bank_id;
        }

        if (!qbId) return { success: false, error: 'Tidak ada bank soal terkait' };

        // 2. Dapatkan soal beserta opsi dan kuncinya
        const { data: questions, error: qError } = await supabaseAdmin
            .from('bank_questions')
            .select(`
                id, type, score_default,
                bank_question_options(id, is_correct)
            `)
            .eq('bank_id', qbId);

        if (qError || !questions) return { success: false, error: 'Gagal memuat soal untuk grading' };

        let totalScore = 0;
        const answerRecordsToInsert: any[] = [];

        let maxPossibleScore = 0;

        let hasEssay = false;

        // 3. Kalkulasi Skor
        for (const q of questions) {
            const defaultAttemptScore = q.score_default || 1;
            maxPossibleScore += defaultAttemptScore;

            const rawAnswer = studentAnswers[q.id];

            if (q.type === 'essay' || q.type === 'esay' || q.type === 'uraian') {
                hasEssay = true;
                if (rawAnswer) {
                    answerRecordsToInsert.push({
                        question_id: q.id,
                        essay_answer: rawAnswer,
                        score: 0,
                        is_correct: null
                    });
                }
            } else {
                const correctOption = q.bank_question_options?.find((o: any) => o.is_correct);
                const isCorrect = rawAnswer && correctOption && rawAnswer === correctOption.id;
                const scoreEarned = isCorrect ? defaultAttemptScore : 0;
                totalScore += scoreEarned;

                if (rawAnswer) {
                    answerRecordsToInsert.push({
                        question_id: q.id,
                        selected_option_id: rawAnswer,
                        score: scoreEarned,
                        is_correct: isCorrect
                    });
                }
            }
        }

        // Konversi ke skala 100
        const finalScore100 = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

        // 4. Simpan ke exam_attempts
        const { data: attempt, error: attemptError } = await supabaseAdmin
            .from('exam_attempts')
            .insert({
                organization_id: exam.organization_id,
                exam_id: examId,
                user_id: userId,
                status: 'submitted',
                needs_manual_grading: hasEssay,
                started_at: new Date().toISOString(), // Idealnya disimpan saat pertama buka
                finished_at: new Date().toISOString(),
                total_score: finalScore100
            })
            .select('id')
            .single();

        if (attemptError || !attempt) {
            console.error('Submit: attempt error', attemptError);
            return { success: false, error: 'Gagal mencatat percobaan ujian' };
        }

        // 5. Simpan ke tabel answers
        if (answerRecordsToInsert.length > 0) {
            const answersWithAttemptId = answerRecordsToInsert.map(a => ({
                ...a,
                attempt_id: attempt.id
            }));

            const { error: answersError } = await supabaseAdmin
                .from('answers')
                .insert(answersWithAttemptId);

            if (answersError) {
                console.error('Submit: answers error (tetap disubmit, tapi log gagal)', answersError);
            }
        }

        return { success: true, score: finalScore100 };
    } catch (err: any) {
        console.error('Submit Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Mendapatkan riwayat ujian siswa
 */
export async function getStudentResultsAction(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!userId) return [];

    const { data, error } = await supabaseAdmin
        .from('exam_attempts')
        .select(`
            id,
            total_score,
            finished_at,
            status,
            needs_manual_grading,
            exams (
                title,
                duration_minutes,
                show_results
            )
        `)
        .eq('user_id', userId)
        .order('finished_at', { ascending: false });

    if (error) {
        console.error('getStudentResults error:', error);
        return [];
    }

    return data || [];
}

/**
 * Mendapatkan detail hasil ujian siswa (jawaban benar/salah)
 * Hanya dipanggil jika exam.show_results = true
 */
export async function getAttemptDetailsAction(attemptId: string, userId: string) {
    const supabaseAdmin = getSupabaseAdmin();

    // Verifikasi kepemilikan
    const { data: attempt, error: attemptError } = await supabaseAdmin
        .from('exam_attempts')
        .select(`
            id, total_score, status, needs_manual_grading, user_id,
            exams ( title, show_results )
        `)
        .eq('id', attemptId)
        .single();

    if (attemptError || !attempt || attempt.user_id !== userId) return null;

    // Verifikasi izin melihat hasil
    // @ts-ignore
    if (attempt.exams?.show_results !== true) return null;

    const { data: answers, error: answersError } = await supabaseAdmin
        .from('answers')
        .select(`
            id, answer, is_correct, score, essay_answer,
            bank_questions ( id, question, type, options, answer, explanation, score_default )
        `)
        .eq('attempt_id', attemptId);

    if (answersError) return null;

    return {
        attempt,
        answers: answers.map((a: any) => ({
            ...a,
            // Sembunyikan jawaban benar jika bukan ini tujuannya, tapi karena 'show_results' true, kita berikan.
            correctAnswer: a.bank_questions?.answer,
            explanation: a.bank_questions?.explanation
        }))
    };
}
