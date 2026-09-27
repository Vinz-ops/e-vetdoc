import { AppointmentRequestForm } from "@/components/dashboard/appointment-request-form";
import { requireRole } from "@/services/authorization";

export default async function NewAppointmentPage() {
  await requireRole(["owner", "veterinarian", "admin"]);
  return <AppointmentRequestForm />;
}