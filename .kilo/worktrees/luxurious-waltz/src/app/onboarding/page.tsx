import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/services/authorization";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Complete your profile",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const { profile } = await requireAuth();

  if (profile.role !== "owner") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to E-VetDoc</CardTitle>
          <CardDescription>
            Your email is confirmed. Complete your profile before accessing your pet-care workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} onboarding />
        </CardContent>
      </Card>
    </main>
  );
}
