"use client";

import { useRouter } from "next/navigation";
import { PetForm } from "@/components/dashboard/pets/pet-form";
import { createOwnedPet, type PetFormInput } from "@/services/pets";

export function NewPetEntry() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add a pet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a patient record for a pet linked to your account.</p>
      </div>
      <PetForm
        title="Pet details"
        description="Fields marked by the form are saved to your pet’s clinic record."
        submitLabel="Save pet"
        onCancel={() => router.push("/dashboard?tab=pets")}
        onSubmit={async (value: PetFormInput) => {
          await createOwnedPet(value);
          router.push("/dashboard?tab=pets");
          router.refresh();
        }}
      />
    </div>
  );
}
