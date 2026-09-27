import { requireAuth } from "@/services/authorization";
import { SettingsTab } from "@/components/dashboard/tabs/settings-tab";

export default async function SettingsPage() {
  const { profile } = await requireAuth();

  return <SettingsTab profile={profile} onProfileUpdated={() => {}} />;
}
