# Supabase SQL Fix for Appointment Schedules

Run this SQL in the Supabase SQL Editor to create the `appointment_schedules` table and RLS policies.

```sql
-- 1. Create the appointment_schedules table
CREATE TABLE IF NOT EXISTS public.appointment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.appointment_schedules ENABLE ROW LEVEL SECURITY;

-- 3. Allow read for authenticated users
CREATE POLICY "Allow read for authenticated"
  ON public.appointment_schedules FOR SELECT
  TO authenticated
  USING (true);

-- 4. Allow write for staff/admin (veterinarian or admin role)
CREATE POLICY "Allow write for staff/admin"
  ON public.appointment_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('veterinarian', 'admin')
    )
  );