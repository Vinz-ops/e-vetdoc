import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "veterinarian", "owner"]);

export const appointmentStatus = pgEnum("appointment_status", [
  "booked",
  "requested",
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
  "confirmed",
  "diagnosed",
  "finished",
  "paid",
]);

export const encounterStatus = pgEnum("encounter_status", ["draft", "signed"]);

export const prescriptionStatus = pgEnum("prescription_status", [
  "active",
  "cancelled",
  "completed",
]);

export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "unpaid",
  "partial",
  "paid",
  "voided",
]);

export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "gcash",
  "card",
  "bank_transfer",
]);
