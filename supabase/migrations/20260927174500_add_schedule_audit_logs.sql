CREATE TABLE IF NOT EXISTS "public"."schedule_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "target_schedule_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "previous_values" "jsonb",
    "next_values" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."schedule_audit_logs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."schedule_audit_logs"
    ADD CONSTRAINT "schedule_audit_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."schedule_audit_logs"
    ADD CONSTRAINT "schedule_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."schedule_audit_logs"
    ADD CONSTRAINT "schedule_audit_logs_target_schedule_id_fkey" FOREIGN KEY ("target_schedule_id") REFERENCES "public"."appointment_schedules"("id") ON DELETE CASCADE;

ALTER TABLE "public"."schedule_audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view schedule audit logs" ON "public"."schedule_audit_logs"
    FOR SELECT TO "authenticated"
    USING (
      EXISTS (
        SELECT 1 FROM "public"."profiles"
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );

CREATE POLICY "Admins can insert schedule audit logs" ON "public"."schedule_audit_logs"
    FOR INSERT TO "authenticated"
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM "public"."profiles"
        WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'veterinarian')
      )
    );
