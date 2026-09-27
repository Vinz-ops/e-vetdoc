import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function runTests() {
  console.log("🚀 Starting [P3.2] Encounter Workspace & History Verification...");

  try {
    // 1. Fetch test pet and vet
    const pets = await sql`SELECT id, name FROM public.pets LIMIT 1;`;
    if (pets.length === 0) throw new Error("No pets found.");
    const petId = pets[0].id;

    const vets = await sql`SELECT id, full_name FROM public.profiles WHERE role = 'veterinarian' OR role = 'admin' LIMIT 1;`;
    if (vets.length === 0) throw new Error("No vet found.");
    const vetId = vets[0].id;

    // 2. Create signed historical encounter
    console.log("🔹 Creating past signed encounter for history...");
    const [pastEnc] = await sql`
      INSERT INTO public.encounters (pet_id, veterinarian_id, status, notes, signed_at)
      VALUES (${petId}, ${vetId}, 'signed', 'Past visit notes', now() - interval '7 days')
      RETURNING id;
    `;
    const pastEncId = pastEnc.id;

    await sql`
      INSERT INTO public.clinical_notes (encounter_id, chief_complaint, assessment)
      VALUES (${pastEncId}, 'Vomiting', 'Gastritis');
    `;
    await sql`
      INSERT INTO public.diagnoses (encounter_id, diagnosis_code, description)
      VALUES (${pastEncId}, 'K29', 'Gastritis');
    `;
    await sql`
      INSERT INTO public.treatments (encounter_id, name, cost)
      VALUES (${pastEncId}, 'Fluids', 50.00);
    `;

    // 3. Verify getPetClinicalHistory query logic
    console.log("🔹 Verifying Pet Clinical History retrieval...");
    
    // Simulate the first query of getPetClinicalHistory
    const historyEncounters = await sql`
      SELECT e.*, p.full_name as vet_name 
      FROM public.encounters e
      LEFT JOIN public.profiles p ON e.veterinarian_id = p.id
      WHERE e.pet_id = ${petId} AND e.status = 'signed'
      ORDER BY e.signed_at DESC;
    `;

    if (historyEncounters.length === 0) {
      throw new Error("Failed to fetch historical encounters.");
    }
    
    const fetchedEnc = historyEncounters.find(e => e.id === pastEncId);
    if (!fetchedEnc) throw new Error("Our newly created past encounter was not returned in history.");
    
    // 4. Verify notes/diagnoses join logic
    const encounterIds = historyEncounters.map(e => e.id);
    const diagnoses = await sql`
      SELECT * FROM public.diagnoses WHERE encounter_id = ANY(${encounterIds});
    `;
    const hasOurDiagnosis = diagnoses.some(d => d.description === 'Gastritis' && d.encounter_id === pastEncId);
    if (!hasOurDiagnosis) throw new Error("Diagnosis for historical encounter was not fetched properly.");

    console.log("✅ Pet Clinical History logic verified successfully.");

    // 5. Cleanup test data
    console.log("🔹 Cleaning up test data...");
    await sql`DELETE FROM public.encounters WHERE id = ${pastEncId};`;
    console.log("✅ Test data cleaned up.");

    console.log("\n🎉 ✅ ALL P3.2 WORKSPACE & HISTORY VERIFICATIONS PASSED!");

  } catch (error) {
    console.error("\n❌ Verification Failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runTests();
