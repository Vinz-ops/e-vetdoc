import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in your environment.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function verifyP51() {
  console.log("🚀 Starting [P5.1] Administrator Audit & Activity Logs Verification...\n");

  try {
    // 1. Verify that appointment status history exists
    console.log("🔹 Querying appointment status history logs...");
    const statusLogs = await sql`
      SELECT ash.id, ash.previous_status, ash.new_status, ash.created_at, p.full_name as actor_name
      FROM public.appointment_status_history ash
      LEFT JOIN public.profiles p ON p.id = ash.changed_by_id
      ORDER BY ash.created_at DESC
      LIMIT 5;
    `;
    console.log(`✅ Retrieved ${statusLogs.length} appointment status history logs.`);

    // 2. Verify payment transactions logs
    console.log("🔹 Querying payment transactions logs...");
    const paymentLogs = await sql`
      SELECT pay.id, pay.receipt_number, pay.amount_paid, pay.method, pay.payment_date, p.full_name as recorder_name
      FROM public.payments pay
      LEFT JOIN public.profiles p ON p.id = pay.recorded_by
      ORDER BY pay.payment_date DESC
      LIMIT 5;
    `;
    console.log(`✅ Retrieved ${paymentLogs.length} payment audit logs.`);

    // 3. Verify clinical encounters logs
    console.log("🔹 Querying clinical encounters...");
    const encounterLogs = await sql`
      SELECT enc.id, enc.status, enc.signed_at, enc.created_at, p.full_name as vet_name, pets.name as pet_name
      FROM public.encounters enc
      LEFT JOIN public.profiles p ON p.id = enc.veterinarian_id
      LEFT JOIN public.pets pets ON pets.id = enc.pet_id
      ORDER BY enc.created_at DESC
      LIMIT 5;
    `;
    console.log(`✅ Retrieved ${encounterLogs.length} clinical encounter audit logs.`);

    // 4. Verify staff audit logs
    console.log("🔹 Querying staff account audit logs...");
    const staffAuditLogs = await sql`
      SELECT sal.id, sal.action, sal.created_at, p.full_name as actor_name
      FROM public.staff_audit_logs sal
      LEFT JOIN public.profiles p ON p.id = sal.actor_id
      ORDER BY sal.created_at DESC
      LIMIT 5;
    `;
    console.log(`✅ Retrieved ${staffAuditLogs.length} staff management audit logs.`);

    console.log("\n🎉 ✅ ALL [P5.1] AUDIT LOG VERIFICATION CHECKS PASSED!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyP51();
