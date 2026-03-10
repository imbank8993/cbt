"use server";
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Mengatur organisasi yang sedang dikelola oleh Platform Admin (God Mode)
 */
export async function setActiveOrgAction(orgId: string | null) {
    const cookieStore = await cookies();

    if (orgId) {
        cookieStore.set('managed_org_id', orgId, {
            path: '/',
            maxAge: 60 * 60 * 24, // 24 jam
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    } else {
        cookieStore.delete('managed_org_id');
    }

    revalidatePath('/dashboard/proktor');
    return { success: true };
}

/**
 * Mendapatkan ID organisasi yang sedang dikelola dari cookie
 */
export async function getManagedOrgId() {
    const cookieStore = await cookies();
    return cookieStore.get('managed_org_id')?.value || null;
}

/**
 * Menghapus ujian secara permanen (Hanya selama masa pengujian)
 */
export async function deleteExamAction(examId: string) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        // 1. Bersihkan data target & partisipan
        await supabaseAdmin.from('exam_targets').delete().eq('exam_id', examId);
        await supabaseAdmin.from('exam_participants').delete().eq('exam_id', examId);

        // 2. Bersihkan attempts (dan answers via cascade jika ada)
        // Jika tidak cascade, maka hapus manual answers dulu
        const { data: attempts } = await supabaseAdmin.from('exam_attempts').select('id').eq('exam_id', examId);
        if (attempts && attempts.length > 0) {
            const attemptIds = attempts.map(a => a.id);
            await supabaseAdmin.from('exam_answers').delete().in('attempt_id', attemptIds);
            await supabaseAdmin.from('exam_attempts').delete().eq('exam_id', examId);
        }

        // 3. Hapus Ujian Utama
        const { error: examError } = await supabaseAdmin
            .from('exams')
            .delete()
            .eq('id', examId);

        if (examError) throw examError;

        revalidatePath('/dashboard/proktor/exams');
        revalidatePath('/dashboard/guru/exams');
        return { success: true };
    } catch (error: any) {
        console.error('Admin: Delete exam error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Get Real Stats for Admin Dashboard
 */
export async function getAdminStatsAction() {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        // 1. Get Active Organizations Count (Filtering by is_active)
        const { count: orgCount, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);

        if (orgError) {
            console.error('Admin Stats: Org count error', orgError);
            throw orgError;
        }

        // 2. Get Total Students Count Across All Organizations
        // We filter member_roles by the 'Siswa' role name (case-insensitive)
        const { count: studentCount, error: studentError } = await supabaseAdmin
            .from('member_roles')
            .select('id, roles!inner(name)', { count: 'exact', head: true })
            .ilike('roles.name', 'Siswa');

        if (studentError) {
            console.error('Admin Stats: Student count error', studentError);
        }

        console.log('Admin Dashboard Stats Fetched:', { orgCount, studentCount });

        return {
            success: true,
            data: {
                activeOrgs: orgCount || 0,
                totalStudents: studentCount || 0
            }
        };
    } catch (error: any) {
        console.error('Admin: Get stats error:', error);
        return { success: false, error: error.message };
    }
}
