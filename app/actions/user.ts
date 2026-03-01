"use server";
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Role } from '@/lib/rbac';

export async function listAllUsersAction() {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        // 1. Ambil data dari auth.users
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // 2. Ambil profile untuk mendapatkan full_name
        const { data: profiles } = await supabaseAdmin.from('profiles').select('*');

        // 3. Ambil Platform Admins
        const { data: platformAdmins } = await supabaseAdmin.from('platform_admins').select('id');

        // 4. Ambil Organization Members & Roles
        const { data: members } = await supabaseAdmin
            .from('organization_members')
            .select(`
                id,
                user_id,
                organization_id,
                organizations (name),
                member_roles (
                    roles (name)
                )
            `);

        // Gabungkan data
        return users.map(user => {
            const profile = profiles?.find(p => p.id === user.id);
            const isAdmin = platformAdmins?.some(a => a.id === user.id);
            const userMemberships = members?.filter(m => m.user_id === user.id) || [];

            return {
                id: user.id,
                email: user.email,
                full_name: profile?.full_name || 'No Name',
                isAdmin,
                memberships: userMemberships.map(m => ({
                    orgName: (m.organizations as any)?.name,
                    role: (m.member_roles as any)?.[0]?.roles?.name
                }))
            };
        });
    } catch (error) {
        console.error('Error listing users:', error);
        return [];
    }
}

export async function getOrgsAndRolesAction() {
    const supabaseAdmin = getSupabaseAdmin();
    const [orgs, roles] = await Promise.all([
        supabaseAdmin.from('organizations').select('id, name'),
        supabaseAdmin.from('roles').select('id, name')
    ]);
    return {
        orgs: orgs.data || [],
        roles: roles.data || []
    };
}

export async function updateUserRoleAction(userId: string, email: string, config: {
    type: 'admin' | 'org',
    action: 'add' | 'remove',
    roleName?: Role,
    orgId?: string
}) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        if (config.type === 'admin') {
            if (config.action === 'add') {
                await supabaseAdmin.from('platform_admins').insert({ id: userId, email });
            } else {
                await supabaseAdmin.from('platform_admins').delete().eq('id', userId);
            }
        } else if (config.type === 'org' && config.orgId && config.roleName) {
            if (config.action === 'add') {
                // 1. Tambahkan ke member
                const { data: member, error: mErr } = await supabaseAdmin
                    .from('organization_members')
                    .upsert({ organization_id: config.orgId, user_id: userId })
                    .select()
                    .single();

                if (mErr) throw mErr;

                // 2. Ambil role ID
                const { data: role } = await supabaseAdmin.from('roles').select('id').eq('name', config.roleName).single();

                if (role) {
                    await supabaseAdmin.from('member_roles').insert({
                        organization_member_id: member.id,
                        role_id: role.id
                    });
                }
            } else {
                // Sederhanakan: Hapus dari member (akan cascade ke member_roles)
                await supabaseAdmin.from('organization_members').delete().eq('user_id', userId).eq('organization_id', config.orgId);
            }
        }
        revalidatePath('/dashboard/admin/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
