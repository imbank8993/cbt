"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getSettingsAction() {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { data, error } = await supabaseAdmin
            .from('unelma_settings')
            .select('*');

        if (error) throw error;
        return { success: true, settings: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSettingAction(key: string, value: any) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { error } = await supabaseAdmin
            .from('unelma_settings')
            .update({
                value,
                updated_at: new Date().toISOString()
            })
            .eq('key', key);

        if (error) throw error;

        revalidatePath('/dashboard/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
