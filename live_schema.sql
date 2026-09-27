--
-- PostgreSQL database dump
--

\restrict RJlxGFHICbCNPMp5pL9eULZxUZYQ6bvTC1xYkkYOQuCvQvTjNqQFWvkDeTcvOFS

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: appointment_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_mode AS ENUM (
    'in_person',
    'virtual'
);


--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_status AS ENUM (
    'requested',
    'scheduled',
    'completed',
    'cancelled',
    'no_show',
    'confirmed',
    'diagnosed',
    'finished',
    'paid',
    'booked'
);


--
-- Name: cancellation_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cancellation_reason AS ENUM (
    'owner_request',
    'clinic_emergency',
    'weather',
    'no_veterinarian_available',
    'pet_health_issue',
    'other'
);


--
-- Name: encounter_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.encounter_status AS ENUM (
    'draft',
    'signed'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'unpaid',
    'partial',
    'paid',
    'voided'
);


--
-- Name: owner_relationship; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.owner_relationship AS ENUM (
    'owner',
    'co_owner',
    'family',
    'caretaker'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'gcash',
    'card',
    'bank_transfer'
);


--
-- Name: pet_sex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pet_sex AS ENUM (
    'male',
    'female',
    'unknown'
);


--
-- Name: pet_species; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pet_species AS ENUM (
    'dog',
    'cat',
    'bird',
    'rabbit',
    'reptile',
    'other'
);


--
-- Name: prescription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prescription_status AS ENUM (
    'active',
    'cancelled',
    'completed'
);


--
-- Name: reschedule_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reschedule_reason AS ENUM (
    'owner_request',
    'veterinarian_unavailable',
    'clinic_schedule_conflict',
    'equipment_issue',
    'pet_health_issue',
    'other'
);


--
-- Name: schedule_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.schedule_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'veterinarian',
    'owner'
);


--
-- Name: check_double_booking(uuid, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_double_booking(p_veterinarian_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE assigned_veterinarian_id = p_veterinarian_id
    AND status IN ('requested', 'scheduled')
    AND scheduled_start IS NOT NULL
    AND scheduled_end IS NOT NULL
    AND scheduled_start < p_end
    AND scheduled_end > p_start
    AND (p_exclude_appointment_id IS NULL OR id <> p_exclude_appointment_id)
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: pets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    species public.pet_species NOT NULL,
    breed text,
    sex public.pet_sex DEFAULT 'unknown'::public.pet_sex NOT NULL,
    date_of_birth date,
    age integer,
    color text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    species_detail text
);


--
-- Name: create_owned_pet(text, public.pet_species, text, text, public.pet_sex, date, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_owned_pet(p_name text, p_species public.pet_species, p_species_detail text DEFAULT NULL::text, p_breed text DEFAULT NULL::text, p_sex public.pet_sex DEFAULT 'unknown'::public.pet_sex, p_date_of_birth date DEFAULT NULL::date, p_age integer DEFAULT NULL::integer, p_color text DEFAULT NULL::text, p_notes text DEFAULT NULL::text) RETURNS public.pets
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  new_pet public.pets;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT private.is_owner()) THEN
    RAISE EXCEPTION 'Only active owners can add pets';
  END IF;

  IF btrim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'A pet name is required';
  END IF;

  IF p_species = 'other' AND btrim(coalesce(p_species_detail, '')) = '' THEN
    RAISE EXCEPTION 'Please specify the species';
  END IF;

  IF p_age IS NOT NULL AND p_age < 0 THEN
    RAISE EXCEPTION 'Age cannot be negative';
  END IF;

  INSERT INTO public.pets (
    name,
    species,
    species_detail,
    breed,
    sex,
    date_of_birth,
    age,
    color,
    notes
  )
  VALUES (
    btrim(p_name),
    p_species,
    CASE WHEN p_species = 'other' THEN nullif(btrim(p_species_detail), '') ELSE NULL END,
    nullif(btrim(p_breed), ''),
    p_sex,
    p_date_of_birth,
    p_age,
    nullif(btrim(p_color), ''),
    nullif(btrim(p_notes), '')
  )
  RETURNING * INTO new_pet;

  INSERT INTO public.pet_owners (
    pet_id,
    owner_profile_id,
    relationship,
    is_primary_contact,
    can_view_medical_records,
    can_receive_notifications
  )
  VALUES (
    new_pet.id,
    (SELECT auth.uid()),
    'owner',
    true,
    true,
    true
  );

  RETURN new_pet;
END;
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: generate_receipt_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_receipt_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'RCPT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'private'
    AS $$
DECLARE
  profile_full_name text;
BEGIN
  profile_full_name := private.auth_user_display_name(NEW.raw_user_meta_data);

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, profile_full_name)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), EXCLUDED.full_name);

  RETURN NEW;
END;
$$;


--
-- Name: log_appointment_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_appointment_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_user_id uuid := (SELECT auth.uid());
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_status_history (
      appointment_id,
      previous_status,
      new_status,
      changed_by_id,
      reason,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      current_user_id,
      CASE
        WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason::text
        WHEN NEW.status = 'scheduled' AND OLD.status = 'requested' THEN 'confirmed'
        WHEN NEW.status = 'no_show' THEN 'no_show'
        ELSE NULL
      END,
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_profile_from_auth_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_profile_from_auth_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'private'
    AS $$
DECLARE
  profile_full_name text;
BEGIN
  profile_full_name := private.auth_user_display_name(NEW.raw_user_meta_data);

  UPDATE public.profiles
  SET
    email = NEW.email,
    full_name = COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), profile_full_name)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


--
-- Name: appointment_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    day_of_week integer NOT NULL,
    start_time time with time zone NOT NULL,
    end_time time with time zone NOT NULL,
    max_capacity integer DEFAULT 3 NOT NULL,
    current_bookings integer DEFAULT 0 NOT NULL,
    status public.schedule_status DEFAULT 'active'::public.schedule_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    specific_date date,
    is_recurring boolean DEFAULT true,
    is_closed boolean DEFAULT false,
    CONSTRAINT appointment_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: appointment_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid NOT NULL,
    previous_status public.appointment_status,
    new_status public.appointment_status NOT NULL,
    changed_by_id uuid,
    reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pet_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    service_id uuid,
    status public.appointment_status DEFAULT 'requested'::public.appointment_status NOT NULL,
    mode public.appointment_mode DEFAULT 'in_person'::public.appointment_mode NOT NULL,
    reason text,
    notes text,
    preferred_date date,
    preferred_time text,
    scheduled_start timestamp with time zone,
    scheduled_end timestamp with time zone,
    assigned_veterinarian_id uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason public.cancellation_reason,
    rescheduled_from uuid,
    no_show_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clinical_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id uuid NOT NULL,
    chief_complaint text,
    subjective text,
    objective text,
    assessment text,
    plan text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnoses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id uuid NOT NULL,
    diagnosis_code text,
    description text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: encounter_amendments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounter_amendments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id uuid NOT NULL,
    veterinarian_id uuid NOT NULL,
    amendment_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: encounters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    pet_id uuid NOT NULL,
    veterinarian_id uuid NOT NULL,
    status public.encounter_status DEFAULT 'draft'::public.encounter_status NOT NULL,
    notes text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT '1'::numeric NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    is_vatable boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    encounter_id uuid,
    owner_id uuid NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    issue_date timestamp without time zone DEFAULT now() NOT NULL,
    due_date date,
    vatable_sales numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    vat_exempt_sales numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    zero_rated_sales numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    vat_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    discount_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    receipt_number text NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    method public.payment_method NOT NULL,
    reference_number text,
    payment_date timestamp without time zone DEFAULT now() NOT NULL,
    recorded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pet_owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_owners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pet_id uuid NOT NULL,
    owner_profile_id uuid NOT NULL,
    relationship public.owner_relationship DEFAULT 'owner'::public.owner_relationship NOT NULL,
    is_primary_contact boolean DEFAULT false NOT NULL,
    can_view_medical_records boolean DEFAULT true NOT NULL,
    can_receive_notifications boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id uuid NOT NULL,
    veterinarian_id uuid NOT NULL,
    pet_id uuid NOT NULL,
    medication_name text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    instructions text,
    status public.prescription_status DEFAULT 'active'::public.prescription_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    role public.user_role DEFAULT 'owner'::public.user_role,
    full_name text,
    phone text,
    address text,
    emergency_contact_name text,
    emergency_contact_phone text,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: receipt_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    short_desc text,
    category text,
    price_from numeric(10,2),
    price_to numeric(10,2),
    price_label text,
    duration_minutes integer,
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT true,
    display_order integer DEFAULT 0,
    icon text,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: staff_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid NOT NULL,
    target_profile_id uuid NOT NULL,
    action text NOT NULL,
    previous_values jsonb,
    next_values jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: treatments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    cost numeric(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appointment_schedules appointment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_schedules
    ADD CONSTRAINT appointment_schedules_pkey PRIMARY KEY (id);


--
-- Name: appointment_status_history appointment_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_status_history
    ADD CONSTRAINT appointment_status_history_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: clinical_notes clinical_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_pkey PRIMARY KEY (id);


--
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (id);


--
-- Name: encounter_amendments encounter_amendments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_amendments
    ADD CONSTRAINT encounter_amendments_pkey PRIMARY KEY (id);


--
-- Name: encounters encounters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_receipt_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_receipt_number_unique UNIQUE (receipt_number);


--
-- Name: pet_owners pet_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT pet_owners_pkey PRIMARY KEY (id);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: staff_audit_logs staff_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_audit_logs
    ADD CONSTRAINT staff_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (id);


--
-- Name: idx_appointment_schedules_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_schedules_day ON public.appointment_schedules USING btree (day_of_week);


--
-- Name: idx_appointment_schedules_is_closed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_schedules_is_closed ON public.appointment_schedules USING btree (is_closed);


--
-- Name: idx_appointment_schedules_specific_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_schedules_specific_date ON public.appointment_schedules USING btree (specific_date);


--
-- Name: idx_appointment_schedules_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_schedules_status ON public.appointment_schedules USING btree (status);


--
-- Name: idx_appointment_status_history_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_status_history_appointment_id ON public.appointment_status_history USING btree (appointment_id);


--
-- Name: idx_appointment_status_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_status_history_created_at ON public.appointment_status_history USING btree (created_at);


--
-- Name: idx_appointments_assigned_veterinarian_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_assigned_veterinarian_id ON public.appointments USING btree (assigned_veterinarian_id);


--
-- Name: idx_appointments_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_owner_id ON public.appointments USING btree (owner_id);


--
-- Name: idx_appointments_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_pet_id ON public.appointments USING btree (pet_id);


--
-- Name: idx_appointments_scheduled_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_scheduled_start ON public.appointments USING btree (scheduled_start);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_clinical_notes_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_notes_encounter_id ON public.clinical_notes USING btree (encounter_id);


--
-- Name: idx_diagnoses_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnoses_encounter_id ON public.diagnoses USING btree (encounter_id);


--
-- Name: idx_encounter_amendments_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encounter_amendments_encounter_id ON public.encounter_amendments USING btree (encounter_id);


--
-- Name: idx_encounters_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encounters_appointment_id ON public.encounters USING btree (appointment_id);


--
-- Name: idx_encounters_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encounters_pet_id ON public.encounters USING btree (pet_id);


--
-- Name: idx_encounters_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encounters_status ON public.encounters USING btree (status);


--
-- Name: idx_encounters_veterinarian_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encounters_veterinarian_id ON public.encounters USING btree (veterinarian_id);


--
-- Name: idx_pet_owners_owner_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_owners_owner_profile_id ON public.pet_owners USING btree (owner_profile_id);


--
-- Name: idx_pet_owners_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pet_owners_pet_id ON public.pet_owners USING btree (pet_id);


--
-- Name: idx_pets_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pets_name ON public.pets USING btree (name);


--
-- Name: idx_pets_species; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pets_species ON public.pets USING btree (species);


--
-- Name: idx_prescriptions_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_encounter_id ON public.prescriptions USING btree (encounter_id);


--
-- Name: idx_prescriptions_pet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_pet_id ON public.prescriptions USING btree (pet_id);


--
-- Name: idx_prescriptions_veterinarian_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_veterinarian_id ON public.prescriptions USING btree (veterinarian_id);


--
-- Name: idx_services_is_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_is_published ON public.services USING btree (is_published);


--
-- Name: idx_treatments_encounter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatments_encounter_id ON public.treatments USING btree (encounter_id);


--
-- Name: services_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX services_slug_idx ON public.services USING btree (slug);


--
-- Name: staff_audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX staff_audit_logs_created_at_idx ON public.staff_audit_logs USING btree (created_at);


--
-- Name: staff_audit_logs_target_profile_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX staff_audit_logs_target_profile_id_idx ON public.staff_audit_logs USING btree (target_profile_id);


--
-- Name: unique_pet_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_pet_owner ON public.pet_owners USING btree (pet_id, owner_profile_id);


--
-- Name: appointments appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: clinical_notes clinical_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: encounters encounters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encounters_updated_at BEFORE UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: pet_owners pet_owners_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pet_owners_updated_at BEFORE UPDATE ON public.pet_owners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: pets pets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: prescriptions prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles protect_final_active_admin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER protect_final_active_admin BEFORE UPDATE OF role, is_active ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.prevent_removing_final_active_admin();


--
-- Name: services services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: invoices set_invoice_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: payments set_receipt_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_receipt_number BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();


--
-- Name: appointments trigger_log_appointment_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_appointment_status_change AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.log_appointment_status_change();


--
-- Name: appointment_status_history appointment_status_history_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_status_history
    ADD CONSTRAINT appointment_status_history_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: appointment_status_history appointment_status_history_changed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_status_history
    ADD CONSTRAINT appointment_status_history_changed_by_id_fkey FOREIGN KEY (changed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_assigned_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_assigned_veterinarian_id_fkey FOREIGN KEY (assigned_veterinarian_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: appointments appointments_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_rescheduled_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_rescheduled_from_fkey FOREIGN KEY (rescheduled_from) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: clinical_notes clinical_notes_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE CASCADE;


--
-- Name: diagnoses diagnoses_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE CASCADE;


--
-- Name: encounter_amendments encounter_amendments_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_amendments
    ADD CONSTRAINT encounter_amendments_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE RESTRICT;


--
-- Name: encounter_amendments encounter_amendments_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounter_amendments
    ADD CONSTRAINT encounter_amendments_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: encounters encounters_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: encounters encounters_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- Name: encounters encounters_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_encounter_id_encounters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_encounter_id_encounters_id_fk FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_owner_id_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_owner_id_profiles_id_fk FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payments payments_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: payments payments_recorded_by_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_recorded_by_profiles_id_fk FOREIGN KEY (recorded_by) REFERENCES public.profiles(id);


--
-- Name: pet_owners pet_owners_owner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT pet_owners_owner_profile_id_fkey FOREIGN KEY (owner_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pet_owners pet_owners_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT pet_owners_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: profiles profiles_id_auth_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_auth_users_id_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: staff_audit_logs staff_audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_audit_logs
    ADD CONSTRAINT staff_audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: staff_audit_logs staff_audit_logs_target_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_audit_logs
    ADD CONSTRAINT staff_audit_logs_target_profile_id_fkey FOREIGN KEY (target_profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: treatments treatments_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE CASCADE;


--
-- Name: services Allow public read access on services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on services" ON public.services FOR SELECT USING (true);


--
-- Name: appointment_schedules Allow read for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated" ON public.appointment_schedules FOR SELECT TO authenticated USING (true);


--
-- Name: appointment_schedules Allow write for staff/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow write for staff/admin" ON public.appointment_schedules TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['veterinarian'::public.user_role, 'admin'::public.user_role]))))));


--
-- Name: appointments admins delete appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins delete appointments" ON public.appointments FOR DELETE TO authenticated USING (( SELECT private.is_admin() AS is_admin));


--
-- Name: encounters admins delete encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins delete encounters" ON public.encounters FOR DELETE TO authenticated USING (( SELECT private.is_admin() AS is_admin));


--
-- Name: appointment_schedules admins manage appointment schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage appointment schedules" ON public.appointment_schedules TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));


--
-- Name: pet_owners admins manage pet_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage pet_owners" ON public.pet_owners TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));


--
-- Name: pets admins manage pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage pets" ON public.pets TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));


--
-- Name: profiles admins manage profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage profiles" ON public.profiles TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));


--
-- Name: services admins manage services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage services" ON public.services TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));


--
-- Name: staff_audit_logs admins view staff audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins view staff audit logs" ON public.staff_audit_logs FOR SELECT TO authenticated USING (( SELECT private.is_admin() AS is_admin));


--
-- Name: appointment_schedules allow authenticated to view appointment schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "allow authenticated to view appointment schedules" ON public.appointment_schedules FOR SELECT TO authenticated USING (true);


--
-- Name: profiles anyone can view veterinarians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "anyone can view veterinarians" ON public.profiles FOR SELECT TO authenticated USING (((role = 'veterinarian'::public.user_role) OR (role = 'admin'::public.user_role)));


--
-- Name: appointment_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointment_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: appointment_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: diagnoses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

--
-- Name: encounter_amendments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encounter_amendments ENABLE ROW LEVEL SECURITY;

--
-- Name: encounters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments owners cancel own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners cancel own appointments" ON public.appointments FOR UPDATE TO authenticated USING (((owner_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['requested'::public.appointment_status, 'scheduled'::public.appointment_status, 'booked'::public.appointment_status])))) WITH CHECK (((owner_id = ( SELECT auth.uid() AS uid)) AND (status = 'cancelled'::public.appointment_status)));


--
-- Name: appointments owners create appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = appointments.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))) AND (status = ANY (ARRAY['requested'::public.appointment_status, 'scheduled'::public.appointment_status, 'booked'::public.appointment_status])) AND (owner_id = ( SELECT auth.uid() AS uid))));


--
-- Name: pets owners update linked pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners update linked pets" ON public.pets FOR UPDATE TO authenticated USING ((( SELECT private.is_owner() AS is_owner) AND (EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = pets.id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT private.is_owner() AS is_owner) AND (EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = pets.id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: appointment_status_history owners view appointment status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view appointment status history" ON public.appointment_status_history FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.appointments a
     JOIN public.pet_owners po ON ((po.pet_id = a.pet_id)))
  WHERE ((a.id = appointment_status_history.appointment_id) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: pets owners view linked pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view linked pets" ON public.pets FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = pets.id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: appointments owners view own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view own appointments" ON public.appointments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = appointments.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: invoice_items owners view own invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view own invoice items" ON public.invoice_items FOR SELECT TO authenticated USING ((invoice_id IN ( SELECT invoices.id
   FROM public.invoices
  WHERE (invoices.owner_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: invoices owners view own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view own invoices" ON public.invoices FOR SELECT TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: payments owners view own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view own payments" ON public.payments FOR SELECT TO authenticated USING ((invoice_id IN ( SELECT invoices.id
   FROM public.invoices
  WHERE (invoices.owner_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: pet_owners owners view own pet_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view own pet_owners" ON public.pet_owners FOR SELECT TO authenticated USING ((owner_profile_id = ( SELECT auth.uid() AS uid)));


--
-- Name: encounter_amendments owners view permitted amendments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view permitted amendments" ON public.encounter_amendments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.encounters e
     JOIN public.pet_owners po ON ((po.pet_id = e.pet_id)))
  WHERE ((e.id = encounter_amendments.encounter_id) AND (e.status = 'signed'::public.encounter_status) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid)) AND (po.can_view_medical_records = true)))));


--
-- Name: diagnoses owners view permitted diagnoses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view permitted diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.encounters e
     JOIN public.pet_owners po ON ((po.pet_id = e.pet_id)))
  WHERE ((e.id = diagnoses.encounter_id) AND (e.status = 'signed'::public.encounter_status) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid)) AND (po.can_view_medical_records = true)))));


--
-- Name: encounters owners view permitted encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view permitted encounters" ON public.encounters FOR SELECT TO authenticated USING (((status = 'signed'::public.encounter_status) AND (EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = encounters.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid)) AND (pet_owners.can_view_medical_records = true))))));


--
-- Name: clinical_notes owners view permitted notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view permitted notes" ON public.clinical_notes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.encounters e
     JOIN public.pet_owners po ON ((po.pet_id = e.pet_id)))
  WHERE ((e.id = clinical_notes.encounter_id) AND (e.status = 'signed'::public.encounter_status) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid)) AND (po.can_view_medical_records = true)))));


--
-- Name: prescriptions owners view permitted prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view permitted prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.encounters e
     JOIN public.pet_owners po ON ((po.pet_id = e.pet_id)))
  WHERE ((e.id = prescriptions.encounter_id) AND (e.status = 'signed'::public.encounter_status) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid)) AND (po.can_view_medical_records = true)))));


--
-- Name: treatments owners view permitted treatments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owners view permitted treatments" ON public.treatments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.encounters e
     JOIN public.pet_owners po ON ((po.pet_id = e.pet_id)))
  WHERE ((e.id = treatments.encounter_id) AND (e.status = 'signed'::public.encounter_status) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid)) AND (po.can_view_medical_records = true)))));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: pet_owners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pet_owners ENABLE ROW LEVEL SECURITY;

--
-- Name: pets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

--
-- Name: prescriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: services public read published services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read published services" ON public.services FOR SELECT TO authenticated, anon USING ((is_published = true));


--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: encounter_amendments staff insert amendments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff insert amendments" ON public.encounter_amendments FOR INSERT TO authenticated WITH CHECK (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = encounter_amendments.encounter_id) AND (e.status = 'signed'::public.encounter_status))))));


--
-- Name: encounters staff insert encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff insert encounters" ON public.encounters FOR INSERT TO authenticated WITH CHECK ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: appointments staff manage appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage appointments" ON public.appointments FOR UPDATE TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role)))))) WITH CHECK ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: diagnoses staff manage diagnoses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage diagnoses" ON public.diagnoses TO authenticated USING (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = diagnoses.encounter_id) AND (e.status = 'draft'::public.encounter_status)))))) WITH CHECK (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = diagnoses.encounter_id) AND (e.status = 'draft'::public.encounter_status))))));


--
-- Name: invoice_items staff manage invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage invoice items" ON public.invoice_items TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'veterinarian'::public.user_role))) WITH CHECK ((( SELECT private.is_admin() AS is_admin) OR (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'veterinarian'::public.user_role)));


--
-- Name: invoices staff manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage invoices" ON public.invoices TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'veterinarian'::public.user_role))) WITH CHECK ((( SELECT private.is_admin() AS is_admin) OR (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'veterinarian'::public.user_role)));


--
-- Name: clinical_notes staff manage notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage notes" ON public.clinical_notes TO authenticated USING (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = clinical_notes.encounter_id) AND (e.status = 'draft'::public.encounter_status)))))) WITH CHECK (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = clinical_notes.encounter_id) AND (e.status = 'draft'::public.encounter_status))))));


--
-- Name: payments staff manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage payments" ON public.payments TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'veterinarian'::public.user_role))) WITH CHECK ((( SELECT private.is_admin() AS is_admin) OR (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'veterinarian'::public.user_role)));


--
-- Name: prescriptions staff manage prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage prescriptions" ON public.prescriptions TO authenticated USING (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = prescriptions.encounter_id) AND (e.status = 'draft'::public.encounter_status)))))) WITH CHECK (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = prescriptions.encounter_id) AND (e.status = 'draft'::public.encounter_status))))));


--
-- Name: treatments staff manage treatments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff manage treatments" ON public.treatments TO authenticated USING (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = treatments.encounter_id) AND (e.status = 'draft'::public.encounter_status)))))) WITH CHECK (((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))) AND (EXISTS ( SELECT 1
   FROM public.encounters e
  WHERE ((e.id = treatments.encounter_id) AND (e.status = 'draft'::public.encounter_status))))));


--
-- Name: encounters staff update draft encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff update draft encounters" ON public.encounters FOR UPDATE TO authenticated USING (((status = 'draft'::public.encounter_status) AND (( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))))) WITH CHECK ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: encounter_amendments staff view all amendments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all amendments" ON public.encounter_amendments FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: appointments staff view all appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all appointments" ON public.appointments FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: diagnoses staff view all diagnoses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: encounters staff view all encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all encounters" ON public.encounters FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: clinical_notes staff view all notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all notes" ON public.clinical_notes FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: pets staff view all pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all pets" ON public.pets FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: prescriptions staff view all prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: treatments staff view all treatments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view all treatments" ON public.treatments FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: appointment_schedules staff view appointment schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view appointment schedules" ON public.appointment_schedules FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: appointment_status_history staff view appointment status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "staff view appointment status history" ON public.appointment_status_history FOR SELECT TO authenticated USING ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));


--
-- Name: staff_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: appointment_status_history system insert status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "system insert status history" ON public.appointment_status_history FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: treatments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = id)) WITH CHECK (((( SELECT auth.uid() AS uid) = id) AND ( SELECT private.is_own_profile_update_permitted(profiles.email, profiles.role, profiles.is_active) AS is_own_profile_update_permitted)));


--
-- Name: profiles users view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = id));


--
-- Name: profiles veterinarians view owner profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "veterinarians view owner profiles" ON public.profiles FOR SELECT TO authenticated USING (((role = 'owner'::public.user_role) AND ( SELECT private.is_veterinarian() AS is_veterinarian)));


--
-- Name: pet_owners veterinarians view pet_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "veterinarians view pet_owners" ON public.pet_owners FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role)))));


--
-- PostgreSQL database dump complete
--

\unrestrict RJlxGFHICbCNPMp5pL9eULZxUZYQ6bvTC1xYkkYOQuCvQvTjNqQFWvkDeTcvOFS

