"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateSubscriptionAction(orgId: string, packageId: string, durationDays: number) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + durationDays);

        // Upsert subscription
        const { error } = await supabaseAdmin
            .from('organization_subscriptions')
            .upsert({
                organization_id: orgId,
                package_id: packageId,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'organization_id'
            });

        if (error) throw error;

        revalidatePath('/dashboard/admin/orgs');
        return { success: true };
    } catch (error: any) {
        console.error('Update subscription error:', error);
        return { success: false, error: error.message };
    }
}

export async function getOrgSubscriptionStatus(orgId: string) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const { data, error } = await supabaseAdmin
            .from('organization_subscriptions')
            .select('*, package:package_id(*)')
            .eq('organization_id', orgId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

        return { success: true, subscription: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
