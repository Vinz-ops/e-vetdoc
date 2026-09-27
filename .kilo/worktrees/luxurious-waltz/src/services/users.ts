"use server";

import { createClient } from '@/utils/supabase/server';
import { verifyRateLimit } from '@/lib/ratelimit';


export async function getAllProfiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Check if current user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    // Regular users might only see public info, but for this demo:
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');
    return profiles || [];
  }

  // Admin can see everything
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*');
  return profiles || [];
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return profile;
}

export async function updateProfile(updates: {
  full_name?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rateLimit = await verifyRateLimit(user.id, "profile-update");
  if (!rateLimit.success && rateLimit.reason !== "redis_not_configured") {
    throw new Error("Rate limit exceeded. Try again in 10 seconds.");
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeOwnerProfile(updates: {
  full_name: string;
  phone: string;
  address: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}) {
  const fullName = updates.full_name.trim();
  const phone = updates.phone.trim();
  const address = updates.address.trim();

  if (!fullName || !phone || !address) {
    throw new Error("Enter your full name, phone number, and address to continue.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) throw new Error("Confirm your email before completing your profile.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "owner") {
    throw new Error("Only owner accounts can use this onboarding flow.");
  }

  return updateProfile({
    full_name: fullName,
    phone,
    address,
    emergency_contact_name: updates.emergency_contact_name?.trim() || undefined,
    emergency_contact_phone: updates.emergency_contact_phone?.trim() || undefined,
  });
}
