import {
  boolean,
  index,
  integer,
  pgTable,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    shortDesc: text("short_desc"),
    category: text("category"),
    priceFrom: numeric("price_from", { precision: 10, scale: 2 }),
    priceTo: numeric("price_to", { precision: 10, scale: 2 }),
    priceLabel: text("price_label"),
    durationMinutes: integer("duration_minutes"),
    isFeatured: boolean("is_featured").default(false),
    isPublished: boolean("is_published").default(true),
    displayOrder: integer("display_order").default(0),
    icon: text("icon"),
    imageUrl: text("image_url"),
    createdAt,
    updatedAt,
  },
  (t) => ({
    slugIdx: uniqueIndex("services_slug_idx").on(t.slug),
    isPublishedIdx: index("idx_services_is_published").on(t.isPublished),
  })
);