"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function registerOrganizationAction(formData: any) {
    const { name, slug, proktorName, proktorEmail, proktorPassword } = formData;
    const supabaseAdmin = getSupabaseAdmin();

    try {
        // 1. Create the Proctor User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: proktorEmail,
            password: proktorPassword,
            email_confirm: true,
            user_metadata: {
                full_name: proktorName,
                role: 'Proktor'
            }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Create the Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert([
                {
                    name,
                    slug,
                    is_active: true,
                    proktor_email: proktorEmail
                }
            ])
            .select()
            .single();

        if (orgError) throw orgError;
        const orgId = orgData.id;

        // 3. Create the Profile (if not handle by trigger)
        await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                full_name: proktorName
            });

        // 4. Link User to Organization as Member
        const { error: memberError } = await supabaseAdmin
            .from('organization_members')
            .insert({
                organization_id: orgId,
                user_id: userId,
                is_active: true
            });

        if (memberError) throw memberError;

        // 5. Assign Proktor Role
        // First get the Proktor role ID
        const { data: roleData } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'Proktor')
            .single();

        if (roleData) {
            // Get the member ID
            const { data: memberData } = await supabaseAdmin
                .from('organization_members')
                .select('id')
                .eq('organization_id', orgId)
                .eq('user_id', userId)
                .single();

            if (memberData) {
                await supabaseAdmin
                    .from('member_roles')
                    .insert({
                        organization_member_id: memberData.id,
                        role_id: roleData.id
                    });
            }
        }

        // 6. Create Default Subscription (30 days)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);

        await supabaseAdmin
            .from('organization_subscriptions')
            .insert({
                organization_id: orgId,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active'
            });

        revalidatePath('/dashboard/admin/orgs');
        return { success: true };

    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}
