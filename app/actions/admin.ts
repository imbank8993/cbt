"use server";
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
