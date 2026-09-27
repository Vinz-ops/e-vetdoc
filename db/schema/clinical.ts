import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "./core";
import { appointments, pets } from "./clinic";
import { encounterStatus, prescriptionStatus } from "./enums";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const encounters = pgTable(
  "encounters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    veterinarianId: uuid("veterinarian_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    status: encounterStatus("status").notNull().default("draft"),
    notes: text("notes"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => ({
    appointmentIdx: index("idx_encounters_appointment_id").on(t.appointmentId),
    petIdx: index("idx_encounters_pet_id").on(t.petId),
    veterinarianIdx: index("idx_encounters_veterinarian_id").on(t.veterinarianId),
    statusIdx: index("idx_encounters_status").on(t.status),
  })
);

export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    chiefComplaint: text("chief_complaint"),
    subjective: text("subjective"),
    objective: text("objective"),
    assessment: text("assessment"),
    plan: text("plan"),
    createdAt,
    updatedAt,
  },
  (t) => ({
    encounterIdx: index("idx_clinical_notes_encounter_id").on(t.encounterId),
  })
);

export const diagnoses = pgTable(
  "diagnoses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    diagnosisCode: text("diagnosis_code"),
    description: text("description").notNull(),
    notes: text("notes"),
    createdAt,
  },
  (t) => ({
    encounterIdx: index("idx_diagnoses_encounter_id").on(t.encounterId),
  })
);

export const treatments = pgTable(
  "treatments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    cost: numeric("cost", { precision: 10, scale: 2 }),
    createdAt,
  },
  (t) => ({
    encounterIdx: index("idx_treatments_encounter_id").on(t.encounterId),
  })
);

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    veterinarianId: uuid("veterinarian_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    medicationName: text("medication_name").notNull(),
    dosage: text("dosage").notNull(),
    frequency: text("frequency").notNull(),
    duration: text("duration").notNull(),
    instructions: text("instructions"),
    status: prescriptionStatus("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (t) => ({
    encounterIdx: index("idx_prescriptions_encounter_id").on(t.encounterId),
    petIdx: index("idx_prescriptions_pet_id").on(t.petId),
    veterinarianIdx: index("idx_prescriptions_veterinarian_id").on(t.veterinarianId),
  })
);

export const encounterAmendments = pgTable(
  "encounter_amendments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "restrict" }),
    veterinarianId: uuid("veterinarian_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    amendmentText: text("amendment_text").notNull(),
    createdAt,
  },
  (t) => ({
    encounterIdx: index("idx_encounter_amendments_encounter_id").on(t.encounterId),
  })
);
