"use server";
import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Update user profile details (name and avatar)
 */
export async function updateUserProfileAction(userId: string, data: { fullName?: string, avatarUrl?: string }) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const updates: any = {};
        if (data.fullName !== undefined) updates.full_name = data.fullName;
        if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        // Also update auth metadata for convenience
        const metadataUpdate: any = {};
        if (data.fullName) metadataUpdate.full_name = data.fullName;
        if (data.avatarUrl !== undefined) metadataUpdate.avatar_url = data.avatarUrl;

        if (Object.keys(metadataUpdate).length > 0) {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: metadataUpdate
            });
        }

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error: any) {
        console.error('User: Profile update error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update current user password and sign out all sessions
 */
export async function updateUserPasswordAction(userId: string, newPassword: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Update password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (updateError) throw updateError;

        // 2. Sign out all sessions (Global Logout)
        // Note: For current user session, we might need a client-side signout as well
        // but this ensures other devices are kicked out.
        await supabaseAdmin.auth.admin.signOut(userId, 'global');

        return { success: true };
    } catch (error: any) {
        console.error('User: Password update error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Proctor/Admin reset a member's password
 */
export async function resetMemberPasswordAction(memberUserId: string, newPassword: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(memberUserId, {
            password: newPassword
        });

        if (error) throw error;

        // Optionally global logout the student too
        await supabaseAdmin.auth.admin.signOut(memberUserId, 'global');

        return { success: true };
    } catch (error: any) {
        console.error('User: Member password reset error:', error);
        return { success: false, error: error.message };
    }
}
