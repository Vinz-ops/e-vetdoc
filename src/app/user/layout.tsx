import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser, isOwnerProfileComplete } from "@/services/authorization";
import { redirect } from "next/navigation";

export default async function UserRecordLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session?.user) redirect("/login");

  const { user, profile } = session;
  if (profile.role === "owner" && !isOwnerProfileComplete(profile)) redirect("/onboarding");

  return <DashboardShell user={user} profile={profile}>{children}</DashboardShell>;
}
