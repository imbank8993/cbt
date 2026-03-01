
import { getSupabaseAdmin } from './lib/supabase';

async function check() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('question_banks').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}

check();
