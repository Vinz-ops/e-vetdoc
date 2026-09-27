import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('services').insert([
    { name: 'General Checkup', duration_minutes: 30, price_from: 500, is_active: true }
  ]).select();
  console.log('Inserted:', data);
  if (error) console.error(error);
}
run();
