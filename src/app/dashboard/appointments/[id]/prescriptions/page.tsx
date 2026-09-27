import { requireAuth } from "@/services/authorization";
import { getAppointmentById } from "@/services/appointments";
import { getEncounterByAppointmentId, getEncounterDetails } from "@/services/clinical";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Pill, Clock, CalendarDays, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAuth();
  const { id } = await params;

  let appt;
  try {
    appt = await getAppointmentById(id);
  } catch {
    notFound();
  }

  // Ensure owner can only view their own
  if (profile.role === "owner" && appt.owner_id !== profile.id) {
    notFound();
  }

  const existingEncounter = await getEncounterByAppointmentId(id).catch(() => null);
  if (!existingEncounter) {
    notFound();
  }

  const encounterDetails = await getEncounterDetails(existingEncounter.id).catch(() => null);
  if (!encounterDetails) {
    notFound();
  }

  const vetName = encounterDetails.encounter?.veterinarian?.full_name || appt.veterinarian?.full_name || "N/A";
  const prescriptions = encounterDetails.prescriptions || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/appointments/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Appointment
        </Link>
      </div>

      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Pill className="h-8 w-8 text-primary" />
          Prescriptions
        </h1>
        <p className="text-muted-foreground">
          Medical prescriptions for <strong className="text-foreground">{appt.pets?.name || "Patient"}</strong>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {prescriptions.length > 0 ? (
            <div className="space-y-4">
              {prescriptions.map((p: any) => (
                <Card key={p.id} className="overflow-hidden border-border/60 shadow-sm">
                  <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                    <h3 className="font-bold text-lg text-primary">{p.medication_name}</h3>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5" /> Dosage
                        </div>
                        <div className="font-medium">{p.dosage || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Frequency
                        </div>
                        <div className="font-medium">{p.frequency || "—"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> Duration
                        </div>
                        <div className="font-medium">{p.duration || "—"}</div>
                      </div>
                    </div>
                    
                    {p.instructions && (
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" /> Instructions / Route
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/90">{p.instructions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Prescriptions</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  There are no prescriptions recorded for this encounter yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="bg-muted/30 border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Encounter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs mb-1">Veterinarian</span>
                <span className="font-medium text-foreground">{vetName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-1">Date</span>
                <span className="font-medium text-foreground">
                  {encounterDetails.encounter?.created_at ? new Date(encounterDetails.encounter.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-1">Status</span>
                <span className="capitalize font-medium text-foreground">{existingEncounter.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
