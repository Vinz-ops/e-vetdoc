import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/utils/supabase/server";

async function verifyP52() {
  console.log("🚀 Starting [P5.2] Owner Portal Verification...\n");
  const adminClient = createAdminClient();

  // 1. Verify Pet Owners and can_view_medical_records column
  console.log("🔹 1. Checking pet_owners relationship table and permission columns...");
  const { data: petOwners, error: poErr } = await adminClient
    .from("pet_owners")
    .select("owner_profile_id, pet_id, relationship, can_view_medical_records, is_primary_contact")
    .limit(5);

  if (poErr) {
    console.error("❌ Failed to query pet_owners:", poErr.message);
    process.exit(1);
  }
  console.log(`✅ Retrieved ${petOwners?.length ?? 0} pet owner relationships.`);
  for (const po of petOwners || []) {
    console.log(`   - Owner: ${po.owner_profile_id} | Pet: ${po.pet_id} | Type: ${po.relationship} | Can View Records: ${po.can_view_medical_records}`);
  }

  // 2. Verify Invoices, Line Items, and Payments query structure for owner billing
  console.log("\n🔹 2. Checking owner invoices and payment receipt query...");
  const { data: invoices, error: invErr } = await adminClient
    .from("invoices")
    .select(`
      id,
      invoice_number,
      status,
      total_amount,
      owner_id,
      invoice_items (id, description, quantity, unit_price),
      payments (id, receipt_number, amount_paid, method)
    `)
    .limit(5);

  if (invErr) {
    console.error("❌ Failed to query invoices with relations:", invErr.message);
    process.exit(1);
  }
  console.log(`✅ Retrieved ${invoices?.length ?? 0} sample invoices with items & receipts.`);
  for (const inv of invoices || []) {
    console.log(`   - Invoice #${inv.invoice_number} (${inv.status}) | Items: ${inv.invoice_items?.length} | Payments: ${inv.payments?.length}`);
  }

  // 3. Verify Appointments and Pets link for owner dashboard overview
  console.log("\n🔹 3. Checking owner appointments & pets summary query...");
  const { data: appts, error: apptErr } = await adminClient
    .from("appointments")
    .select(`
      id,
      scheduled_start,
      status,
      owner_id,
      pets!appointments_pet_id_fkey (id, name, species),
      services!appointments_service_id_fkey (id, name, price_from)
    `)
    .limit(5);

  if (apptErr) {
    console.error("❌ Failed to query appointments for owner summary:", apptErr.message);
    process.exit(1);
  }
  console.log(`✅ Retrieved ${appts?.length ?? 0} appointments with joined pet and service.`);

  // 4. Verify Signed Clinical Encounters for Owner Medical Records
  console.log("\n🔹 4. Checking signed encounters query for owner medical view...");
  const { data: encounters, error: encErr } = await adminClient
    .from("encounters")
    .select(`
      id,
      pet_id,
      status,
      created_at,
      clinical_notes (*),
      diagnoses (*),
      treatments (*),
      prescriptions (*)
    `)
    .eq("status", "signed")
    .limit(5);

  if (encErr) {
    console.error("❌ Failed to query signed clinical encounters:", encErr.message);
    process.exit(1);
  }
  console.log(`✅ Retrieved ${encounters?.length ?? 0} signed encounters with notes, diagnoses, treatments, and prescriptions.`);

  console.log("\n🎉 ✅ ALL [P5.2] OWNER PORTAL & BILLING VERIFICATION CHECKS PASSED!");
}

verifyP52().catch((err) => {
  console.error("❌ Uncaught verification error:", err);
  process.exit(1);
});
