import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Use Midtrans Client to verify notification
        const notification = await snap.transaction.notification(body);

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        console.log(`Webhook received for ${orderId}: status=${transactionStatus}, fraud=${fraudStatus}`);

        let status = 'pending';
        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                status = 'challenge';
            } else if (fraudStatus === 'accept') {
                status = 'settlement';
            }
        } else if (transactionStatus === 'settlement') {
            status = 'settlement';
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            status = 'failure';
        } else if (transactionStatus === 'pending') {
            status = 'pending';
        }

        // Update database
        const { data: transaction, error: fetchError } = await supabase
            .from('unelma_transactions')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
            .from('unelma_transactions')
            .update({
                status: status,
                raw_response: notification,
                payment_type: notification.payment_type,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) throw updateError;

        // AUTO-ACCOUNT CREATION LOGIC
        if (status === 'settlement' && !transaction.user_id && transaction.guest_email) {
            console.log(`Creating auto-account for ${transaction.guest_email}`);
            const supabaseAdmin = (await import('@/lib/supabase')).getSupabaseAdmin();

            // 1. Create Auth User
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: transaction.guest_email,
                password: 'Unelma123', // Temporary password
                email_confirm: true,
                user_metadata: {
                    full_name: transaction.guest_name,
                    role: 'Proktor'
                }
            });

            if (!authError && authUser.user) {
                const userId = authUser.user.id;

                // 2. Create Organization
                const slug = (transaction.organization_name || 'org').toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(7);

                const { data: orgData, error: orgError } = await supabaseAdmin
                    .from('organizations')
                    .insert({
                        name: transaction.organization_name || `${transaction.guest_name}'s Org`,
                        slug,
                        is_active: true,
                        proktor_email: transaction.guest_email
                    })
                    .select()
                    .single();

                if (!orgError && orgData) {
                    const orgId = orgData.id;

                    // 3. Create Profile
                    await supabaseAdmin.from('profiles').upsert({
                        id: userId,
                        full_name: transaction.guest_name
                    });

                    // 4. Link User to Org
                    const { data: memberData } = await supabaseAdmin
                        .from('organization_members')
                        .insert({
                            organization_id: orgId,
                            user_id: userId,
                            is_active: true
                        })
                        .select()
                        .single();

                    // 5. Assign Role
                    const { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', 'Proktor').single();
                    if (roleData && memberData) {
                        await supabaseAdmin.from('member_roles').insert({
                            organization_member_id: memberData.id,
                            role_id: roleData.id
                        });
                    }

                    // 6. Create Subscription
                    const startDate = new Date();
                    const endDate = new Date();
                    let durationDays = 30; // Default

                    // Try to get duration from pricelist if item_type is pricelist
                    if (transaction.item_type === 'pricelist' && transaction.item_id) {
                        const { data: pkgData } = await supabaseAdmin
                            .from('unelma_pricelist')
                            .select('duration_days')
                            .eq('id', transaction.item_id)
                            .single();
                        if (pkgData) durationDays = pkgData.duration_days;
                    }

                    endDate.setDate(startDate.getDate() + durationDays);

                    await supabaseAdmin
                        .from('organization_subscriptions')
                        .insert({
                            organization_id: orgId,
                            package_id: (transaction.item_type === 'pricelist' ? transaction.item_id : null),
                            start_date: startDate.toISOString(),
                            end_date: endDate.toISOString(),
                            status: 'active'
                        });

                    // 7. Update transaction with the new user_id
                    await supabaseAdmin
                        .from('unelma_transactions')
                        .update({ user_id: userId })
                        .eq('id', transaction.id);
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Notification processed' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
