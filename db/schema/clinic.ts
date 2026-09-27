import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "./core";
import { appointmentStatus } from "./enums";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const petSpecies = pgEnum("pet_species", ["dog", "cat", "bird", "rabbit", "reptile", "other"]);
export const petSex = pgEnum("pet_sex", ["male", "female", "unknown"]);
export const ownerRelationship = pgEnum("owner_relationship", ["owner", "co_owner", "family", "caretaker"]);

export const appointmentMode = pgEnum("appointment_mode", ["in_person", "virtual"]);
export const cancellationReason = pgEnum("cancellation_reason", [
  "owner_request",
  "clinic_emergency",
  "weather",
  "no_veterinarian_available",
  "pet_health_issue",
  "other",
]);
export const rescheduleReason = pgEnum("reschedule_reason", [
  "owner_request",
  "veterinarian_unavailable",
  "clinic_schedule_conflict",
  "equipment_issue",
  "pet_health_issue",
  "other",
]);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    status: appointmentStatus("status").notNull().default("requested"),
    mode: appointmentMode("mode").notNull().default("in_person"),
    reason: text("reason"),
    notes: text("notes"),
    preferredDate: date("preferred_date"),
    preferredTime: text("preferred_time"),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
    assignedVeterinarianId: uuid("assigned_veterinarian_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: cancellationReason("cancellation_reason"),
    rescheduledFrom: uuid("rescheduled_from").references((): any => appointments.id, {
      onDelete: "set null",
    }),
    noShowAt: timestamp("no_show_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => ({
    petIdx: index("idx_appointments_pet_id").on(t.petId),
    ownerIdx: index("idx_appointments_owner_id").on(t.ownerId),
    statusIdx: index("idx_appointments_status").on(t.status),
    scheduledStartIdx: index("idx_appointments_scheduled_start").on(t.scheduledStart),
    veterinarianIdx: index("idx_appointments_assigned_veterinarian_id").on(t.assignedVeterinarianId),
  })
);

export const appointmentStatusHistory = pgTable(
  "appointment_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    previousStatus: appointmentStatus("previous_status"),
    newStatus: appointmentStatus("new_status").notNull(),
    changedById: uuid("changed_by_id").references(() => profiles.id, { onDelete: "set null" }),
    reason: text("reason"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    appointmentIdx: index("idx_appointment_status_history_appointment_id").on(t.appointmentId),
    createdAtIdx: index("idx_appointment_status_history_created_at").on(t.createdAt),
  })
);

export const pets = pgTable(
  "pets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    species: petSpecies("species").notNull(),
    speciesDetail: text("species_detail"),
    breed: text("breed"),
    sex: petSex("sex").notNull().default("unknown"),
    dateOfBirth: date("date_of_birth"),
    age: integer("age"),
    color: text("color"),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (t) => ({
    nameIdx: index("idx_pets_name").on(t.name),
    speciesIdx: index("idx_pets_species").on(t.species),
  })
);

export const petOwners = pgTable(
  "pet_owners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    ownerProfileId: uuid("owner_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    relationship: ownerRelationship("relationship").notNull().default("owner"),
    isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
    canViewMedicalRecords: boolean("can_view_medical_records").notNull().default(true),
    canReceiveNotifications: boolean("can_receive_notifications").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (t) => ({
    petIdx: index("idx_pet_owners_pet_id").on(t.petId),
    ownerIdx: index("idx_pet_owners_owner_profile_id").on(t.ownerProfileId),
    uniquePetOwner: uniqueIndex("unique_pet_owner").on(t.petId, t.ownerProfileId),
  })
);

import { services } from "./services";
