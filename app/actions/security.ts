"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Log a security violation during an exam attempt
 */
export async function logSecurityViolationAction(attemptId: string, eventType: string, metadata: any = {}) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Insert into security logs
        const { error: logError } = await supabaseAdmin
            .from('attempt_security_logs')
            .insert({
                attempt_id: attemptId,
                event_type: eventType,
                metadata: metadata
            });

        if (logError) throw logError;

        // 2. Increment violation count in exam_attempts
        // We'll increment warning_count or tab_switch_count based on eventType
        const updates: any = {};
        if (eventType === 'tab_switch' || eventType === 'blur') {
            const { data: attempt } = await supabaseAdmin.from('exam_attempts').select('tab_switch_count, warning_count').eq('id', attemptId).single();
            if (attempt) {
                updates.tab_switch_count = (attempt.tab_switch_count || 0) + 1;
                updates.warning_count = (attempt.warning_count || 0) + 1;
            }
        } else {
            const { data: attempt } = await supabaseAdmin.from('exam_attempts').select('warning_count').eq('id', attemptId).single();
            if (attempt) {
                updates.warning_count = (attempt.warning_count || 0) + 1;
            }
        }

        if (Object.keys(updates).length > 0) {
            await supabaseAdmin
                .from('exam_attempts')
                .update(updates)
                .eq('id', attemptId);
        }

        revalidatePath(`/dashboard/proktor/monitoring`); // Trigger monitoring update
        return { success: true, warningCount: updates.warning_count };
    } catch (error: any) {
        console.error('Security: Log violation error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Force logout a student due to severe security violation
 */
export async function forceLogoutStudentAction(userId: string, attemptId: string, reason: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Mark attempt as auto_submitted (terminated)
        await supabaseAdmin
            .from('exam_attempts')
            .update({
                status: 'auto_submitted',
                finished_at: new Date().toISOString()
            })
            .eq('id', attemptId);

        // 2. Global Signout for the user
        await supabaseAdmin.auth.admin.signOut(userId, 'global');

        // 3. Log the termination
        await supabaseAdmin
            .from('attempt_security_logs')
            .insert({
                attempt_id: attemptId,
                event_type: 'FORCE_TERMINATED',
                metadata: { reason }
            });

        return { success: true };
    } catch (error: any) {
        console.error('Security: Force logout error:', error);
        return { success: false, error: error.message };
    }
}
