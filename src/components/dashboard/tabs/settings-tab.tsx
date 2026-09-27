"use client";

import { User as UserIcon, Shield } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { SecurityForm } from "@/components/security-form";
import { useState } from "react";
import type { Database } from "@/types/supabase";

const SECTIONS = [
  { id: "profile",  label: "Profile",      icon: UserIcon },
  { id: "security", label: "Security",     icon: Shield },
] as const;

type SectionId = typeof SECTIONS[number]["id"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface SettingsTabProps {
  profile: Profile;
  onProfileUpdated: (profile: Profile) => void;
}

export function SettingsTab({ profile, onProfileUpdated }: SettingsTabProps) {
  const [section, setSection] = useState<SectionId>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Account and security preferences.
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
              section === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        {section === "profile" ? (
          <ProfileForm profile={profile} onProfileUpdated={onProfileUpdated} />
        ) : section === "security" ? (
          <SecurityForm />
        ) : null}
      </div>
    </div>
  );
}
