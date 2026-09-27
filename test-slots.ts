import { getAvailableSlots } from "./src/services/appointments";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  try {
    const res = await getAvailableSlots(undefined, "2026-08-31");
    console.log("Success! Slots:", res.slots.length, "Scheduled:", res.scheduled.length);
    console.dir(res.slots, { depth: null });
  } catch (err) {
    console.error("Error calling getAvailableSlots:", err);
  }
}

run();
