"use server";
import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type QuestionType = 'mcq' | 'mcq_complex' | 'true_false' | 'matching' | 'categorization' | 'short_answer' | 'essay';

/**
 * Save or Update a question with its options and metadata
 */
export async function saveQuestionAction(data: {
    id?: string;
    bankId: string;
    orgId: string;
    type: QuestionType;
    questionText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    scoreDefault: number;
    metadata?: any;
    options?: { id?: string; text: string; isCorrect: boolean; order: number; weight: number; metadata?: any }[];
}) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Upsert Question
        const { data: question, error: qErr } = await supabaseAdmin
            .from('bank_questions')
            .upsert({
                id: data.id,
                bank_id: data.bankId,
                organization_id: data.orgId,
                type: data.type,
                question_text: data.questionText,
                difficulty: data.difficulty,
                score_default: data.scoreDefault,
                metadata: data.metadata || {}
            })
            .select()
            .single();

        if (qErr) throw qErr;

        // 2. Handle Options if provided
        if (data.options && data.options.length > 0) {
            // Delete old options if updating
            if (data.id) {
                await supabaseAdmin.from('bank_question_options').delete().eq('question_id', data.id);
            }

            const optionsToInsert = data.options.map(opt => ({
                question_id: question.id,
                option_text: opt.text,
                is_correct: opt.isCorrect,
                order: opt.order,
                weight: opt.weight,
                metadata: (opt as any).metadata || {}
            }));

            const { error: oErr } = await supabaseAdmin.from('bank_question_options').insert(optionsToInsert);
            if (oErr) throw oErr;
        }

        revalidatePath(`/dashboard/guru/questions/${data.bankId}`);
        return { success: true, id: question.id };
    } catch (error: any) {
        console.error('Question: Save error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all questions for a specific bank
 */
export async function getBankQuestions(bankId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('bank_questions')
        .select(`
            *,
            bank_question_options (*)
        `)
        .eq('bank_id', bankId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Question: Fetch error:', error);
        return [];
    }

    return data;
}

/**
 * Test server action connectivity
 */
export async function testServerAction() {
    console.log('Test: Server action reached');
    return { success: true, message: 'Server is reaching the database environment.' };
}

/**
 * Create a new question bank
 */
export async function createQuestionBank(orgId: string, userId: string, title: string, description: string, subject: string, classLevel: string) {
    console.log('Bank: Starting creation on server...', { orgId, userId, subject, classLevel });
    try {
        const supabaseAdmin = getSupabaseAdmin();
        console.log('Bank: Admin client initialized');

        const { data, error } = await supabaseAdmin
            .from('question_banks')
            .insert({
                organization_id: orgId,
                created_by: userId,
                title,
                description,
                subject,
                class_level: classLevel,
                is_published: false
            })
            .select()
            .single();

        if (error) {
            console.error('Bank: Database selection error:', error);
            return { success: false, error: 'DB Error: ' + error.message };
        }

        console.log('Bank: Successfully created:', data.id);
        revalidatePath('/dashboard/guru/questions');
        revalidatePath('/dashboard/proktor/questions');
        return { success: true, id: data.id };
    } catch (err: any) {
        console.error('Bank: Critical Server Error:', err);
        return { success: false, error: 'Server Exception: ' + (err.message || 'Unknown') };
    }
}

/**
 * Delete a question bank and all its contents
 */
export async function deleteQuestionBank(bankId: string, orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('question_banks')
            .delete()
            .eq('id', bankId)
            .eq('organization_id', orgId);

        if (error) throw error;

        revalidatePath('/dashboard/guru/questions');
        revalidatePath('/dashboard/proktor/questions');
        return { success: true };
    } catch (error: any) {
        console.error('Bank: Delete error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * List all question banks for an organization with role-based visibility
 */
export async function listQuestionBanks(orgId: string, userId: string) {
    console.log('Bank: Listing for OrgID:', orgId, 'UserID:', userId);
    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Check if user is an Admin or Proctor
        const [{ data: isAdmin }, { data: memberRole }] = await Promise.all([
            supabaseAdmin.from('platform_admins').select('id').eq('id', userId).maybeSingle(),
            supabaseAdmin.from('organization_members')
                .select('member_roles(roles(name))')
                .eq('organization_id', orgId)
                .eq('user_id', userId)
                .maybeSingle()
        ]);

        const roleData = memberRole as any;
        const roleName = roleData?.member_roles?.[0]?.roles?.name || (isAdmin ? 'Admin' : 'Siswa');
        const canSeeAll = roleName === 'Admin' || roleName === 'Proktor';

        let query = supabaseAdmin
            .from('question_banks')
            .select(`
                *,
                profiles (full_name),
                bank_questions(count)
            `)
            .eq('organization_id', orgId);

        // 2. Filter based on role
        if (roleName === 'Proktor' || roleName === 'Admin') {
            // Proktor and Admin can see all banks in the organization
            // No additional filter needed beyond orgId
        } else {
            // Guru/others only see their own banks
            query = query.eq('created_by', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Bank: List error:', error);
            return [];
        }

        // Map count format
        const formattedData = data.map(bank => ({
            ...bank,
            question_count: (bank.bank_questions as any)?.[0]?.count || 0
        }));

        console.log('Bank: Found count:', formattedData.length);
        return formattedData;
    } catch (err) {
        console.error('Bank: List catch error:', err);
        return [];
    }
}

/**
 * Delete a question and its options
 */
export async function deleteQuestionAction(questionId: string, bankId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('bank_questions')
            .delete()
            .eq('id', questionId);

        if (error) throw error;

        revalidatePath(`/dashboard/guru/questions/${bankId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Question: Delete error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Toggle Publish Status of a question bank
 */
export async function toggleQuestionBankPublishAction(bankId: string, orgId: string, isPublished: boolean) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('question_banks')
            .update({ is_published: isPublished })
            .eq('id', bankId)
            .eq('organization_id', orgId);

        if (error) throw error;
        revalidatePath('/dashboard/guru/questions');
        revalidatePath('/dashboard/proktor/questions');
        revalidatePath('/dashboard/proktor/exams');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
