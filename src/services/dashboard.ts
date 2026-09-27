"use server";

import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/services/authorization';

export interface OwnerPetSummary {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string;
  date_of_birth: string | null;
  is_active: boolean;
  relationship_type: string;
  can_view_medical_records: boolean;
  can_schedule_appointments: boolean;
}

export interface OwnerAppointmentSummary {
  id: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  status: string;
  reason: string | null;
  pet: { id: string; name: string; species: string } | null;
  service: { id: string; name: string; duration_minutes: number | null; price_from: number | null } | null;
}

export interface OwnerDashboardSummary {
  profile: { id: string; full_name: string | null; email: string | null; phone: string | null };
  pets: OwnerPetSummary[];
  upcomingAppointments: OwnerAppointmentSummary[];
  recentInvoices: {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  }[];
}

/**
 * Fetch dynamic summary metrics for an authenticated owner.
 */
export async function getOwnerDashboardSummary(): Promise<OwnerDashboardSummary> {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  // 1. Fetch owner's linked pets
  const { data: petLinks } = await supabase
    .from('pet_owners')
    .select(`
      relationship,
      can_view_medical_records,
      can_schedule_appointments:is_primary_contact,
      pet:pets (*)
    `)
    .eq('owner_profile_id', profile.id);

  const pets: OwnerPetSummary[] = (petLinks || [])
    .filter((link) => link.pet && (link.pet as any).is_active !== false)
    .map((link) => {
      const p = link.pet as any;
      return {
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        gender: p.sex || "unknown",
        date_of_birth: p.date_of_birth,
        is_active: p.is_active ?? true,
        relationship_type: link.relationship || "owner",
        can_view_medical_records: Boolean(link.can_view_medical_records),
        can_schedule_appointments: true,
      };
    });

  // 2. Fetch upcoming & active appointments
  const { data: appointments, error: aptErr } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_start,
      scheduled_end,
      preferred_date,
      preferred_time,
      status,
      reason,
      pet:pets!appointments_pet_id_fkey (id, name, species),
      service:services!appointments_service_id_fkey (id, name, duration_minutes, price_from)
    `)
    .eq('owner_id', profile.id)
    .in('status', ['booked', 'confirmed', 'scheduled', 'requested', 'diagnosed', 'paid'])
    .order('preferred_date', { ascending: true, nullsFirst: false })
    .limit(5);

  if (aptErr) {
    console.error("Error fetching owner appointments summary:", aptErr);
  }

  const upcomingAppointments: OwnerAppointmentSummary[] = (appointments || []).map((a: any) => ({
    id: a.id,
    scheduled_start: a.scheduled_start,
    scheduled_end: a.scheduled_end,
    preferred_date: a.preferred_date,
    preferred_time: a.preferred_time,
    status: a.status,
    reason: a.reason,
    pet: a.pet,
    service: a.service,
  }));

  // 3. Fetch recent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total_amount, created_at')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
    },
    pets,
    upcomingAppointments,
    recentInvoices: invoices || [],
  };
}

export interface AdminDashboardSummary {
  petCount: number;
  ownerCount: number;
  activeAppointmentsCount: number;
  unpaidInvoicesCount: number;
  recentAppointments: {
    id: string;
    scheduled_start: string | null;
    preferred_date?: string | null;
    preferred_time?: string | null;
    status: string;
    reason: string | null;
    pet_name: string;
    species: string;
    owner_name: string;
    service_name: string;
  }[];
}

/**
 * Fetch dynamic summary metrics for an authenticated admin or staff member.
 */
export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  const [petsRes, ownersRes, apptsRes, unpaidRes, recentApptsRes] = await Promise.all([
    supabase.from("pets").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["booked", "confirmed", "scheduled", "requested", "diagnosed", "paid"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["unpaid", "partial"]),
    supabase
      .from("appointments")
      .select(`
        id,
        scheduled_start,
        preferred_date,
        preferred_time,
        status,
        reason,
        pets!appointments_pet_id_fkey (name, species),
        owner:profiles!appointments_owner_id_fkey (full_name),
        services!appointments_service_id_fkey (name)
      `)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const recentAppointments = (recentApptsRes.data || []).map((a: any) => ({
    id: a.id,
    scheduled_start: a.scheduled_start,
    preferred_date: a.preferred_date,
    preferred_time: a.preferred_time,
    status: a.status,
    reason: a.reason,
    pet_name: a.pets?.name || "Unknown Patient",
    species: a.pets?.species || "pet",
    owner_name: a.owner?.full_name || "Pet Owner",
    service_name: a.services?.name || "Consultation",
  }));

  return {
    petCount: petsRes.count || 0,
    ownerCount: ownersRes.count || 0,
    activeAppointmentsCount: apptsRes.count || 0,
    unpaidInvoicesCount: unpaidRes.count || 0,
    recentAppointments,
  };
}

export async function getVibeCheckDataPaginated({ pageParam = 0 }: { pageParam?: number } = {}) {
  try {
    const limit = 5; // default page scale
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .range(pageParam * limit, (pageParam + 1) * limit - 1);

    if (error) {
      console.warn("Vibe Check Error. Check your tables:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}

// Keeping original for Server Component base render fallback
export async function getVibeCheckData() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(3);

    if (error) {
      console.warn("Vibe Check Error. Check your tables:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getUserProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile };
  } catch (err) {
    return null;
  }
}
export async function getGithubRepos() {
  // Curated from live GitHub MCP data — 20 most interesting repos from Danncode10
  return [
    { name: "Arduino-PySide6-OpenCV", url: "https://github.com/Danncode10/Arduino-PySide6-OpenCV-Learning-Journey", description: "Gesture-controlled Arduino with Python GUI — combines OpenCV hand tracking, PySide6 UI, and real-world hardware control." },
    { name: "LifeEase", url: "https://github.com/Danncode10/LifeEase", description: "Minimalist productivity app with Task Manager, School Planner & Health Tracker — React Native frontend + FastAPI + SQLite." },
    { name: "Smart-Water-Dispenser", url: "https://github.com/Danncode10/Smart-Water-Dispenser-Arduino-Based-", description: "Arduino-powered auto-dispenser using ultrasonic sensor and servo motor — hands-free and IoT-ready for public use." },
    { name: "map-dashboard", url: "https://github.com/Danncode10/map-dashboard", description: "Map Visualization Dashboard showing environmental maps and conservation data with interactive layers." },
    { name: "my-structure (DannFlow)", url: "https://github.com/Danncode10/my-structure", description: "High-performance Next.js SaaS starter with Supabase, TanStack Query, rate limiting, and AI-native Vibe Coding workflow." },
    { name: "Speed-Analysis-Algorithms", url: "https://github.com/Danncode10/Speed-Analysis-of-Searching-Algorithms", description: "Benchmarks 10 search algorithms in Jupyter — ranks execution time on random datasets with visual performance charts." },
    { name: "Essential-Electrical-Robotics", url: "https://github.com/Danncode10/Essential-Electrical-Components-for-CS-Robotics", description: "Hands-on Arduino robotics course covering resistors, capacitors, relays, and power control for real-world sensors and motors." },
    { name: "Particle-Pressure-Simulator", url: "https://github.com/Danncode10/Particle-Pressure-Simulator-", description: "Physics simulation of particle pressure dynamics — real-time visual rendering of gas particle behavior." },
    { name: "Student-Login-PHP-MySQL", url: "https://github.com/Danncode10/Student-Login-Registration-System-with-PHP-and-MySQL", description: "Full-stack auth system with PHP, MySQL & Bootstrap — password hashing, session management, and protected routes." },
    { name: "Algorithms-Final-Project", url: "https://github.com/Danncode10/Algorithms-Final-Project", description: "Solves 6 algorithm challenges from the 100 Algorithms Challenge series — each in its own Jupyter notebook with test cases." },
    { name: "Scatter-Turtle", url: "https://github.com/Danncode10/Scatter-Turtle", description: "Bet-based turtle racing game built with Python Turtle Graphics — randomized outcomes with interactive betting UI." },
    { name: "Snake-Game", url: "https://github.com/Danncode10/Snake-Game", description: "Classic Snake game reimplemented in Python — keyboard-controlled with collision detection and score tracking." },
    { name: "Ping-Pong-Game", url: "https://github.com/Danncode10/Ping-Pong-Game-Using-Python-and-Turtle-Graphics", description: "Two-player Ping Pong built with Python Turtle Graphics — includes ball physics and live score display." },
    { name: "Turtle-Crossing-Game", url: "https://github.com/Danncode10/Turtle-Crossing-Game", description: "Frogger-style crossing game in Python Turtle — increasing difficulty levels with car collision logic." },
    { name: "Leetcode-Daily", url: "https://github.com/Danncode10/Leetcode-Daily", description: "Daily LeetCode solutions tracking data structures & algorithms mastery — annotated with approach notes for interview prep." },
    { name: "Python-DSA-Competition", url: "https://github.com/Danncode10/Python-DSA-Competition", description: "Competitive DSA solutions for internal competition — optimized Python implementations with time/space analysis." },
    { name: "Learn-PySide6-GUI", url: "https://github.com/Danncode10/Learn-PySide6-Python-GUI-", description: "Learning journey through PySide6 GUI development — covers widgets, layouts, signals, and event-driven programming." },
    { name: "Link-To-QR-Code", url: "https://github.com/Danncode10/Link-To-QR-Code-using-Python", description: "Python utility to convert any URL into a downloadable QR code image — minimal setup, instant output." },
    { name: "Coding-Habit-21-Days", url: "https://github.com/Danncode10/Coding-Habit", description: "21-day coding challenge journal documenting daily progress, lessons learned, and habit formation for a GE Entrep project." },
    { name: "Cpp-Projects", url: "https://github.com/Danncode10/Cpp-projects", description: "Collection of C++ problem sets and mini-projects covering OOP, data structures, and foundational systems programming." },
  ];
}
