"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Receipt, FileText, CheckCircle2, AlertCircle, Clock, CreditCard, Ban, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/types/supabase";
import { getInvoiceById } from "@/services/billing";
import { printOfficialReceipt } from "@/lib/print-receipt";

type Invoice = Tables<"invoices"> & {
  owner: { id: string; full_name: string | null; email: string | null } | null;
};

const STATUS_META: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  draft: {
    label: "Draft",
    icon: <Clock className="size-3" />,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  unpaid: {
    label: "Unpaid",
    icon: <AlertCircle className="size-3" />,
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  partial: {
    label: "Partial",
    icon: <CreditCard className="size-3" />,
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="size-3" />,
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  voided: {
    label: "Voided",
    icon: <Ban className="size-3" />,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function fmtDate(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return String(isoOrDate);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [printingId, setPrintingId] = React.useState<string | null>(null);

  const handlePrint = async (invoiceId: string) => {
    try {
      setPrintingId(invoiceId);
      const fullInvoice = await getInvoiceById(invoiceId);
      if (fullInvoice) {
        printOfficialReceipt(fullInvoice);
      }
    } catch (err) {
      console.error("Failed to fetch invoice for print:", err);
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices & Billing</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {invoices.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage client billing, tax invoices, and official payment receipts.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/billing/new"
          className="inline-flex items-center justify-center min-h-11 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all gap-2"
        >
          <PlusCircle className="size-4" />
          New Invoice
        </Link>
      </div>

      {/* Empty state */}
      {invoices.length === 0 && (
        <Card className="rounded-2xl border border-border bg-card shadow-xs">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="size-7" />
            </div>
            <div className="max-w-sm">
              <p className="text-base font-semibold text-foreground">No invoices generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an invoice for appointments, procedures, medicines, or walk-in sales.
              </p>
            </div>
            <Link
              href="/dashboard/billing/new"
              className="inline-flex items-center justify-center min-h-10 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all gap-2"
            >
              <PlusCircle className="size-3.5" />
              Create First Invoice
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Invoices Data Table */}
      {invoices.length > 0 && (
        <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Client / Owner</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3.5">Total Amount</th>
                  <th className="text-center px-4 py-3.5">Status</th>
                  <th className="text-right px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.map((invoice) => {
                  const statusMeta = STATUS_META[invoice.status] ?? STATUS_META.draft;
                  const isPrinting = printingId === invoice.id;
                  return (
                    <tr key={invoice.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
                        {invoice.invoice_number || (
                          <span className="text-muted-foreground italic font-sans font-normal">Pending Draft</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground text-sm">
                          {invoice.owner?.full_name ?? "Walk-in Client"}
                        </div>
                        {invoice.owner?.email && (
                          <div className="text-xs text-muted-foreground">{invoice.owner.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell text-xs text-muted-foreground">
                        {fmtDate(invoice.issue_date)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-foreground">
                        {fmt(invoice.total_amount)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrint(invoice.id)}
                            disabled={isPrinting}
                            title="Print Official Receipt"
                            className="min-h-9 px-2.5 text-xs font-semibold rounded-lg hover:bg-muted cursor-pointer"
                          >
                            {isPrinting ? (
                              <Loader2 className="size-3.5 animate-spin text-primary" />
                            ) : (
                              <Printer className="size-3.5 text-primary" />
                            )}
                          </Button>
                          <Link
                            href={`/dashboard/billing/${invoice.id}`}
                            className="inline-flex items-center justify-center min-h-9 px-3 text-xs font-semibold rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-foreground transition-all"
                          >
                            View Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
