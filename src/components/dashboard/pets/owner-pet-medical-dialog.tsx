"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Calendar,
  Pill,
  Printer,
  ShieldAlert,
  User,
  Activity,
  CheckCircle2,
  X,
} from "lucide-react";
import { getPetClinicalHistory } from "@/services/clinical";
import { printHtmlDocument } from "@/lib/print-receipt";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

interface OwnerPetMedicalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
  };
}

export function OwnerPetMedicalDialog({ open, onOpenChange, pet }: OwnerPetMedicalDialogProps) {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);

    getPetClinicalHistory(pet.id)
      .then((records) => {
        setHistory(records);
        setHasPermission(true);
      })
      .catch((err) => {
        console.error("Error loading clinical records:", err);
        setHasPermission(false);
      })
      .finally(() => setLoading(false));
  }, [open, pet.id]);

  const handlePrint = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical History - ${pet.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 750px; margin: 0 auto; }
            .header { border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: bold; }
            .sub { font-size: 14px; color: #555; margin-top: 4px; }
            .pet-card { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .encounter { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
            .enc-head { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px; font-weight: bold; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-top: 10px; margin-bottom: 4px; }
            .pill { display: inline-block; background: #eef2ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">E-VetDoc Veterinary Care</div>
            <div class="sub">Official Patient Clinical & Immunization History</div>
          </div>
          <div class="pet-card">
            <div><strong>Patient Name:</strong> ${pet.name}</div>
            <div><strong>Species / Breed:</strong> ${pet.species} ${pet.breed ? `(${pet.breed})` : ""}</div>
            <div><strong>Date of Birth:</strong> ${formatDate(pet.date_of_birth)}</div>
            <div><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <h3>Signed Clinical Visits & Procedures</h3>
          ${
            history.length === 0
              ? "<p>No recorded medical visits found.</p>"
              : history
                  .map(
                    (h) => `
              <div class="encounter">
                <div class="enc-head">
                  <span>Visit Date: ${formatDate(h.encounter.created_at)}</span>
                  <span>Attending: Dr. ${h.encounter.veterinarian?.full_name || "Staff Veterinarian"}</span>
                </div>
                ${h.notes?.physical_exam ? `<div><strong>Physical Exam:</strong> ${h.notes.physical_exam}</div>` : ""}
                ${h.notes?.assessment_notes ? `<div><strong>Clinical Assessment:</strong> ${h.notes.assessment_notes}</div>` : ""}
                
                ${
                  h.diagnoses.length > 0
                    ? `
                  <div class="section-title">Diagnoses</div>
                  <div>${h.diagnoses.map((d: any) => `<span class="pill">${d.title}</span>`).join("")}</div>
                `
                    : ""
                }

                ${
                  h.treatments.length > 0
                    ? `
                  <div class="section-title">Treatments Administered</div>
                  <ul>${h.treatments.map((t: any) => `<li>${t.name} ${t.instructions ? `- ${t.instructions}` : ""}</li>`).join("")}</ul>
                `
                    : ""
                }

                ${
                  h.prescriptions.length > 0
                    ? `
                  <div class="section-title">Prescriptions Issued</div>
                  <ul>${h.prescriptions.map((p: any) => `<li><strong>${p.medication_name}</strong>: ${p.dosage}, ${p.frequency} for ${p.duration}</li>`).join("")}</ul>
                `
                    : ""
                }
              </div>
            `
                  )
                  .join("")
          }

          <div class="footer">
            <p>Official Patient Record generated by E-VetDoc Care Portal.</p>
          </div>
        </body>
      </html>
    `;
    printHtmlDocument(html);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col max-h-[85vh] w-full max-w-2xl bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="size-4 text-primary" />
              {pet.name}&apos;s Health & Medical Records
            </h3>
            <p className="text-xs text-muted-foreground">
              Official clinical history, diagnoses, treatments, and prescriptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs gap-1.5 h-8 font-semibold cursor-pointer"
              >
                <Printer className="size-3.5" />
                Print Record
              </Button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Activity className="size-6 animate-pulse text-primary" />
              Loading medical records...
            </div>
          ) : !hasPermission ? (
            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center space-y-2">
              <ShieldAlert className="size-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Restricted Medical Access</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Co-owner permissions currently restrict viewing clinical medical records for {pet.name}. Please
                contact the primary pet owner to grant access.
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 className="size-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Recorded Medical Visits</p>
              <p className="text-xs text-muted-foreground">
                There are no finalized clinical examination records for {pet.name} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.encounter.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Calendar className="size-3.5 text-primary" />
                      Visit on {formatDate(record.encounter.created_at)}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <User className="size-3" />
                      Attending: Dr. {record.encounter.veterinarian?.full_name || "Staff Veterinarian"}
                    </div>
                  </div>

                  {/* Physical Exam & Assessment */}
                  {record.notes && (
                    <div className="space-y-1.5 text-xs">
                      {record.notes.physical_exam && (
                        <div>
                          <span className="font-semibold text-foreground">Physical Exam: </span>
                          <span className="text-muted-foreground">{record.notes.physical_exam}</span>
                        </div>
                      )}
                      {record.notes.assessment_notes && (
                        <div>
                          <span className="font-semibold text-foreground">Clinical Assessment: </span>
                          <span className="text-muted-foreground">{record.notes.assessment_notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagnoses */}
                  {record.diagnoses.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Diagnoses
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {record.diagnoses.map((d: any) => (
                          <span
                            key={d.id}
                            className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-xs font-semibold"
                          >
                            {d.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Treatments */}
                  {record.treatments.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Treatments Administered
                      </div>
                      <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                        {record.treatments.map((t: any) => (
                          <li key={t.id}>
                            <span className="font-medium text-foreground">{t.name}</span>
                            {t.instructions ? ` — ${t.instructions}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {record.prescriptions.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                        <Pill className="size-3 text-primary" />
                        Prescriptions
                      </div>
                      <div className="space-y-1">
                        {record.prescriptions.map((p: any) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-lg bg-muted/40 border border-border/50 text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-foreground">{p.medication_name}</span>
                              <span className="text-muted-foreground text-[11px]"> ({p.dosage})</span>
                              <div className="text-[11px] text-muted-foreground">
                                {p.frequency} for {p.duration}
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
