import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  timestamp,
  text,
  numeric,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { invoiceStatus, paymentMethod } from "./enums";
import { encounters } from "./clinical";
import { profiles } from "./core";

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().default("").unique(), // e.g. INV-000001 — filled by DB trigger
  encounterId: uuid("encounter_id").references(() => encounters.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  status: invoiceStatus("status").notNull().default("draft"),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: date("due_date"),
  
  // Amounts
  vatableSales: numeric("vatable_sales", { precision: 10, scale: 2 }).notNull().default("0"),
  vatExemptSales: numeric("vat_exempt_sales", { precision: 10, scale: 2 }).notNull().default("0"),
  zeroRatedSales: numeric("zero_rated_sales", { precision: 10, scale: 2 }).notNull().default("0"),
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  isVatable: boolean("is_vatable").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  receiptNumber: text("receipt_number").notNull().default("").unique(), // e.g. RCPT-000001 — filled by DB trigger
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethod("method").notNull(),
  referenceNumber: text("reference_number"), // e.g. GCash Ref No
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  recordedBy: uuid("recorded_by")
    .notNull()
    .references(() => profiles.id), // The admin/staff who recorded it
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


