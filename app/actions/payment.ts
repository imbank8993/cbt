"use server";
import { supabase } from '@/lib/supabase';
// @ts-ignore
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function createTransactionAction(
    item: {
        id: string;
        type: 'layanan' | 'pricelist' | 'produk';
        name: string;
        price: number;
    },
    userData: {
        userId?: string;
        email: string;
        fullName?: string;
        organizationName?: string;
    }
) {
    try {
        const orderId = `ORDER-${item.type.toUpperCase()}-${Date.now()}`;

        // Create transaction in database
        const { data: transaction, error: dbError } = await supabase
            .from('unelma_transactions')
            .insert({
                order_id: orderId,
                user_id: userData.userId || null,
                guest_name: userData.fullName || 'Guest',
                guest_email: userData.email,
                organization_name: userData.organizationName || null,
                item_id: item.id,
                item_type: item.type,
                item_name: item.name,
                amount: item.price,
                status: 'pending'
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // Create Snap Token from Midtrans
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: item.price
            },
            customer_details: {
                email: userData.email,
                first_name: userData.fullName || 'Customer'
            },
            item_details: [{
                id: item.id,
                price: item.price,
                quantity: 1,
                name: item.name
            }]
        };

        const snapResponse = await snap.createTransaction(parameter);

        // Update transaction with snap token
        await supabase
            .from('unelma_transactions')
            .update({ snap_token: snapResponse.token })
            .eq('id', transaction.id);

        return { success: true, token: snapResponse.token, orderId };
    } catch (error: any) {
        console.error('Payment Error:', error);
        return { success: false, error: error.message };
    }
}
export async function getTransactionsAction() {
    try {
        const { data, error } = await supabase
            .from('unelma_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, transactions: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
