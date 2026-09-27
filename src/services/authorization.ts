import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/supabase";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Profile["role"];

export type AuthenticatedUser = {
  user: User;
  profile: Profile;
};

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

export function isOwnerProfileComplete(profile: Profile): boolean {
  return Boolean(
    profile.full_name?.trim() && profile.phone?.trim() && profile.address?.trim(),
  );
}

/**
 * Get the authenticated user and their profile.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || !isEmailVerified(user)) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.role || !profile.is_active) return null;

  return { user, profile };
}

/**
 * Require an authenticated user. Throws redirect to /login if not authenticated.
 * Returns the user and profile on success.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser || !currentUser.user) {
    redirect("/login");
  }

  return currentUser;
}

/**
 * Require the user to have one of the specified roles.
 * Throws redirect to /dashboard if not authorized.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const { user, profile } = await requireAuth();

  if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
    // User exists but doesn't have the required role
    // Redirect to dashboard which will handle the appropriate view
    redirect("/dashboard");
  }

  return { user, profile };
}

/**
 * Check if a profile has the admin role.
 */
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

/**
 * Check if a profile has the veterinarian role.
 */
export function isVeterinarian(profile: Profile | null): boolean {
  return profile?.role === "veterinarian";
}

/**
 * Check if a profile has the owner role.
 */
export function isOwner(profile: Profile | null): boolean {
  return profile?.role === "owner";
}

/**
 * Check if a profile has any staff role (admin or veterinarian).
 */
export function isStaff(profile: Profile | null): boolean {
  return isAdmin(profile) || isVeterinarian(profile);
}

/**
 * Get the appropriate dashboard path based on user role.
 * Admins get /dashboard, owners get /dashboard, etc.
 * In the future this could route to different dashboards per role.
 */
export function getDashboardPath(): string {
  // For now, all roles use /dashboard
  // In the future, staff might go to /dashboard/staff, owners to /dashboard/portal
  return "/dashboard";
}
