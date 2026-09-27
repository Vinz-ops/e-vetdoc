import { createClient } from '@supabase/supabase-js';

export async function wipeTestData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerEmail = process.env.TEST_OWNER_EMAIL || 'ownerTest@gmail.com';
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'adminTest@gmail.com';
  const vetEmail = process.env.TEST_VET_EMAIL || 'vetTest@gmail.com';

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Skipping DB cleanup: SUPABASE_SERVICE_ROLE_KEY missing');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  console.log('Cleaning up old test data before E2E run...');

  const emails = [ownerEmail, adminEmail, vetEmail].map(e => e.toLowerCase());
  
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', emails);

  if (usersError || !users) return;

  const owner = users.find(u => u.email === ownerEmail.toLowerCase());
  const admin = users.find(u => u.email === adminEmail.toLowerCase());
  const vet = users.find(u => u.email === vetEmail.toLowerCase());

  if (owner) {
    const { data: appts } = await supabase.from('appointments').select('id').eq('owner_id', owner.id);
    
    if (appts && appts.length > 0) {
      const apptIds = appts.map(a => a.id);
      
      const { data: encounters } = await supabase.from('encounters').select('id').in('appointment_id', apptIds);
      if (encounters && encounters.length > 0) {
        const encIds = encounters.map(e => e.id);
        await supabase.from('diagnoses').delete().in('encounter_id', encIds);
        await supabase.from('prescriptions').delete().in('encounter_id', encIds);
        await supabase.from('treatments').delete().in('encounter_id', encIds);
        await supabase.from('encounters').delete().in('id', encIds);
      }

      const { data: invoices } = await supabase.from('invoices').select('id').in('appointment_id', apptIds);
      if (invoices && invoices.length > 0) {
        const invIds = invoices.map(i => i.id);
        await supabase.from('invoice_items').delete().in('invoice_id', invIds);
        await supabase.from('invoices').delete().in('id', invIds);
      }
      await supabase.from('appointments').delete().in('id', apptIds);
    }
    await supabase.from('pets').delete().eq('owner_id', owner.id);
  }

  if (admin) await supabase.from('schedules').delete().eq('veterinarian_id', admin.id);
  if (vet) await supabase.from('schedules').delete().eq('veterinarian_id', vet.id);

  const allUserIds = [owner?.id, admin?.id, vet?.id].filter(Boolean) as string[];
  if (allUserIds.length > 0) {
     await supabase.from('clinic_activity_logs').delete().in('actor_id', allUserIds);
  }

  console.log('✅ Test data fully wiped!');
}
