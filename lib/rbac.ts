import { supabase } from './supabase';

export type Role = 'Admin' | 'Proktor' | 'Guru' | 'Pengawas' | 'Siswa';

export const getDashboardPath = (role: Role) => {
    switch (role) {
        case 'Admin': return '/dashboard/admin';
        case 'Proktor': return '/dashboard/proktor';
        case 'Guru': return '/dashboard/guru';
        case 'Pengawas': return '/dashboard/pengawas';
        case 'Siswa': return '/dashboard/siswa';
        default: return '/';
    }
};

export const getUserRole = async (userId: string): Promise<Role | null> => {
    try {
        console.log('RBAC: Memulai pengecekan role untuk UID:', userId);

        // 1. Periksa Platform Admin (Owner)
        const { data: adminData, error: adminError } = await supabase
            .from('platform_admins')
            .select('id')
            .eq('id', userId);

        if (adminError) {
            console.warn('RBAC: Gagal cek platform_admins:', adminError.message || adminError);
        } else if (adminData && adminData.length > 0) {
            console.log('RBAC: User terdeteksi sebagai Admin');
            return 'Admin';
        }

        // 2. Periksa Role Organisasi
        // Kita pecah query agar lebih aman dari kegagalan join RLS
        const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', userId);

        if (memberError) {
            console.warn('RBAC: Gagal cek organization_members:', memberError.message || memberError);
            return null;
        }

        if (memberData && memberData.length > 0) {
            const memberId = memberData[0].id;
            const { data: roleData, error: roleError } = await supabase
                .from('member_roles')
                .select('roles(name)')
                .eq('organization_member_id', memberId)
                .maybeSingle();

            if (roleError) {
                console.warn('RBAC: Gagal cek member_roles:', roleError.message || roleError);
                return null;
            }

            if (roleData?.roles) {
                const roleName = (roleData.roles as any).name;
                console.log('RBAC: User terdeteksi sebagai:', roleName);
                return roleName as Role;
            }
        }

        console.log('RBAC: Tidak ada role yang ditemukan untuk user ini.');
        return null;
    } catch (err) {
        console.error('RBAC: Fatal error:', err);
        return null;
    }
};
