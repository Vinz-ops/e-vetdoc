import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Import client AFTER dotenv config so it uses the correct DATABASE_URL
import { migrationClient } from "./db/client";

async function run() {
  try {
    await migrationClient`ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'booked'`;
    await migrationClient`ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'confirmed'`;
    await migrationClient`ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'diagnosed'`;
    await migrationClient`ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'finished'`;
    await migrationClient`ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'paid'`;
    console.log("Successfully added enum values");
  } catch (err) {
    console.error("Error adding enum values:", err);
  } finally {
    await migrationClient.end();
  }
}

run();
