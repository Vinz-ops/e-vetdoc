import { requireAuth } from "@/services/authorization";
import { getEncounterDetails } from "@/services/clinical";
import { notFound } from "next/navigation";
import { AutoDownloader } from "@/components/dashboard/clinical/auto-downloader";

export default async function PrintEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  let encounterData;
  try {
    encounterData = await getEncounterDetails(id);
  } catch (e) {
    console.error("Failed to load encounter for print:", e);
    notFound();
  }

  const { encounter, notes, diagnoses, treatments, prescriptions } = encounterData;
  const pet = encounter.pets;
  const vet = encounter.veterinarian;

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(date));
  };

  const filename = `Clinical_Record_${encounter.id.split("-")[0].toUpperCase()}.pdf`;

  return (
    <>
      <AutoDownloader filename={filename} targetId="print-container" />
      <div id="print-container" className="p-10 bg-white text-black min-h-screen font-sans max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between border-b-2 border-black pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold">E-VetDoc Clinic</h1>
            <p className="text-sm text-gray-600 mt-1">123 Veterinary Lane, Metro Manila</p>
            <p className="text-sm text-gray-600">contact@evetdoc.ph • (02) 8123-4567</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Clinical Record</h2>
            <p className="mt-2 font-bold">Date: {formatDate(encounter.created_at)}</p>
            <p>Record ID: {encounter.id.split("-")[0].toUpperCase()}</p>
          </div>
        </div>

        {/* Patient & Vet Info */}
        <div className="flex gap-6 mb-8">
          <div className="flex-1 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Patient Information</h3>
            <p className="text-xl font-bold mb-2">{pet?.name}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Species:</span><span className="font-bold">{pet?.species}</span>
              <span className="text-gray-500">Breed:</span><span className="font-bold">{pet?.breed}</span>
              <span className="text-gray-500">Age:</span><span className="font-bold">{pet?.age || '-'} yrs</span>
              <span className="text-gray-500">Sex:</span><span className="font-bold">{pet?.sex}</span>
            </div>
          </div>
          <div className="flex-1 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Attending Veterinarian</h3>
            <p className="text-xl font-bold">{vet?.full_name}</p>
            <p className="text-sm text-gray-600">{vet?.email}</p>
            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="font-bold">Status:</span>
              <span className={`font-bold ${encounter.status === 'signed' ? 'text-black' : 'text-gray-500'}`}>
                {encounter.status === 'signed' ? 'SIGNED FINAL' : 'DRAFT'}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="mb-8">
          <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">Chief Complaint</h3>
          <p className="text-sm">{notes?.chief_complaint || 'None recorded.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">Subjective</h3>
            <p className="text-sm">{notes?.subjective || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">Objective</h3>
            <p className="text-sm">{notes?.objective || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">Assessment</h3>
            <p className="text-sm">{notes?.assessment || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">Plan</h3>
            <p className="text-sm">{notes?.plan || '-'}</p>
          </div>
        </div>

        {/* Diagnoses */}
        {diagnoses && diagnoses.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold border-b border-black pb-1 mb-2">Diagnoses</h3>
            <div className="grid grid-cols-[1fr_3fr] border-b border-gray-200 pb-2 mb-2 font-bold text-gray-500 text-sm">
              <span>Code</span>
              <span>Description</span>
            </div>
            {diagnoses.map((d: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_3fr] border-b border-gray-50 py-2 text-sm">
                <span className="font-bold">{d.diagnosis_code || '-'}</span>
                <span>{d.description || '-'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Treatments */}
        {treatments && treatments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold border-b border-black pb-1 mb-2">Treatments & Procedures</h3>
            <div className="flex justify-between border-b border-gray-200 pb-2 mb-2 font-bold text-gray-500 text-sm">
              <span>Name</span>
              <span>Cost</span>
            </div>
            {treatments.map((t: any, i: number) => (
              <div key={i} className="flex justify-between border-b border-gray-50 py-2 text-sm">
                <span>{t.name || '-'}</span>
                <span>PHP {Number(t.cost || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Prescriptions */}
        {prescriptions && prescriptions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold border-b border-black pb-1 mb-4">Prescriptions</h3>
            {prescriptions.map((p: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-md mb-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-base">Rx: {p.medication_name}</span>
                  <span className="text-gray-500">{p.duration}</span>
                </div>
                <div className="flex gap-6 mb-2">
                  <div><span className="text-gray-500 inline-block w-20">Dosage:</span><span className="font-bold">{p.dosage}</span></div>
                  <div><span className="text-gray-500 inline-block w-24">Frequency:</span><span className="font-bold">{p.frequency}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Instructions: </span>{p.instructions || 'Use as directed'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t-2 border-black flex justify-between items-end">
          <div className="text-xs text-gray-500">
            <p>Generated by E-VetDoc Clinic Management System</p>
            <p>Printed on {formatDate(new Date().toISOString())}</p>
          </div>
          <div className="w-48 text-center">
            <div className="border-b border-black h-10 mb-2"></div>
            <p className="font-bold text-sm">{vet?.full_name}</p>
            <p className="text-xs text-gray-500">Attending Veterinarian</p>
          </div>
        </div>
      </div>
    </>
  );
}
