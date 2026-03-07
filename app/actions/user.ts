import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Role } from '@/lib/rbac';

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

/**
 * List all users with their full name, admin status, and memberships
 * Used for admin user management
 */
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

/**
 * Get all organizations and roles for role assignment
 */
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

/**
 * Update user role (Platform Admin or Organization Role)
 */
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

