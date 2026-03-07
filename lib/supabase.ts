// Force redeploy: 2026-03-07 23:57
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug log for production (safe, no keys exposed)
console.log('Supabase Init: URL detected =', !!supabaseUrl, '| Key detected =', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase Environment Variables are MISSING!');
}

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

// Admin client for server-side operations (requires SERVICE_ROLE_KEY)
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
    }
    return createClient(supabaseUrl!, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
