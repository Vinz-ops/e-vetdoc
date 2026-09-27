import { NewPetEntry } from "@/components/dashboard/pets/new-pet-entry";
import { requireRole } from "@/services/authorization";

export default async function NewPetPage() {
  await requireRole(["owner"]);
  return <NewPetEntry />;
}
