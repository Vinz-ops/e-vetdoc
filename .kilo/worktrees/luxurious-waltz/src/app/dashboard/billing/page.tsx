import { requireRole } from "@/services/authorization";
import { listInvoices } from "@/services/billing";
import { InvoiceList } from "@/components/dashboard/billing/invoice-list";

export default async function BillingPage() {
  await requireRole(["admin", "veterinarian"]);
  const invoices = await listInvoices({ limit: 100 });

  return (
    <div className="mx-auto max-w-6xl w-full px-4 py-6">
      <InvoiceList invoices={invoices} />
    </div>
  );
}
