"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Loader2,
  CreditCard,
  User,
  Calendar,
  Sparkles,
  DollarSign,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { finalizeInvoice, voidInvoice } from "@/services/billing";
import { RecordPaymentDialog } from "@/components/dashboard/billing/record-payment-dialog";
import type { InvoiceWithDetails } from "@/services/billing";
import Link from "next/link";

const STATUS_META: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  draft: {
    label: "Draft",
    icon: <Clock className="size-3.5" />,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  unpaid: {
    label: "Unpaid",
    icon: <AlertCircle className="size-3.5" />,
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  partial: {
    label: "Partially Paid",
    icon: <CreditCard className="size-3.5" />,
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="size-3.5" />,
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  voided: {
    label: "Voided",
    icon: <Ban className="size-3.5" />,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  card: "Credit / Debit Card",
  bank_transfer: "Bank Transfer",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function formatDateOnly(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return String(isoOrDate);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatDateTime(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return String(isoOrDate);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}

import { printOfficialReceipt } from "@/lib/print-receipt";

export function InvoiceDetail({ invoice }: { invoice: InvoiceWithDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const statusMeta = STATUS_META[invoice.status] ?? STATUS_META.draft;
  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const balance = Math.max(0, Number(invoice.total_amount) - totalPaid);
  const canFinalize = invoice.status === "draft" && invoice.invoice_items.length > 0;
  const canPay = (invoice.status === "unpaid" || invoice.status === "partial") && balance > 0;
  const canVoid = invoice.status === "draft" || invoice.status === "unpaid";

  function handleFinalize() {
    setError(null);
    startTransition(async () => {
      try {
        await finalizeInvoice(invoice.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to finalize invoice.");
      }
    });
  }

  function handleVoid() {
    if (!confirm("Are you sure you want to void this invoice? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await voidInvoice(invoice.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to void invoice.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Invoices
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {invoice.invoice_number || "Draft Invoice"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                >
                  {statusMeta.icon}
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Issued {formatDateTime(invoice.issue_date)}
                {invoice.due_date && ` · Due ${formatDateOnly(invoice.due_date)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => printOfficialReceipt(invoice)}
            className="gap-2 min-h-11 rounded-xl font-semibold shadow-xs hover:bg-muted cursor-pointer"
          >
            <Printer className="size-4 text-primary" />
            Print Official Receipt
          </Button>

          {canPay && (
            <Button
              onClick={() => setShowPaymentDialog(true)}
              className="gap-2 min-h-11 rounded-xl font-semibold shadow-sm cursor-pointer"
            >
              <CreditCard className="size-4" />
              Record Payment
            </Button>
          )}

          {canFinalize && (
            <Button
              onClick={handleFinalize}
              disabled={isPending}
              className="gap-2 min-h-11 rounded-xl font-semibold shadow-sm cursor-pointer"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Finalize Invoice
            </Button>
          )}

          {canVoid && (
            <Button
              variant="outline"
              onClick={handleVoid}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive min-h-11 rounded-xl font-medium cursor-pointer"
            >
              Void Invoice
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
        >
          {error}
        </div>
      )}

      {/* Main Invoice Document Card */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Top Decorative Color Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

        <div className="p-6 sm:p-8 space-y-8">
          {/* Header Grid: Client & Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-border/80">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" /> Billed To
              </span>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  {invoice.owner?.full_name ? invoice.owner.full_name.charAt(0).toUpperCase() : "C"}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-base">
                    {invoice.owner?.full_name ?? "Walk-in Client"}
                  </p>
                  {invoice.owner?.email && (
                    <p className="text-xs text-muted-foreground">{invoice.owner.email}</p>
                  )}
                  {invoice.owner?.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{invoice.owner.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center sm:justify-end gap-1.5">
                <Calendar className="size-3.5 text-primary" /> Invoice Schedule
              </span>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Issue Date: </span>
                  <span className="font-semibold text-foreground">{formatDateTime(invoice.issue_date)}</span>
                </div>
                {invoice.due_date && (
                  <div>
                    <span className="text-muted-foreground">Due Date: </span>
                    <span className="font-semibold text-foreground">{formatDateOnly(invoice.due_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Receipt className="size-3.5 text-primary" /> Line Items
              </h2>
              <span className="text-xs text-muted-foreground">
                {invoice.invoice_items.length} {invoice.invoice_items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <th className="text-left px-5 py-3.5">Description</th>
                    <th className="text-center px-4 py-3.5 w-20">Qty</th>
                    <th className="text-right px-4 py-3.5 w-32">Unit Price</th>
                    <th className="text-center px-4 py-3.5 w-24 hidden sm:table-cell">Tax Status</th>
                    <th className="text-right px-5 py-3.5 w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice.invoice_items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-sm text-muted-foreground italic">
                        No line items billed.
                      </td>
                    </tr>
                  ) : (
                    invoice.invoice_items.map((item) => {
                      const subtotal = Number(item.quantity) * Number(item.unit_price);
                      return (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-foreground">{item.description}</td>
                          <td className="px-4 py-3.5 text-center text-muted-foreground">{Number(item.quantity)}</td>
                          <td className="px-4 py-3.5 text-right text-muted-foreground font-mono">
                            {fmt(item.unit_price)}
                          </td>
                          <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                            {item.is_vatable ? (
                              <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                12% VAT
                              </span>
                            ) : (
                              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                Exempt
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-foreground font-mono">
                            {fmt(subtotal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-end pt-2">
            <div className="w-full sm:max-w-xs space-y-2.5 rounded-2xl border border-border bg-muted/20 p-5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>VATable Sales</span>
                  <span className="font-semibold text-foreground font-mono">{fmt(invoice.vatable_sales)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT Exempt Sales</span>
                  <span className="font-semibold text-foreground font-mono">{fmt(invoice.vat_exempt_sales)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (12%)</span>
                  <span className="font-semibold text-foreground font-mono">{fmt(invoice.vat_amount)}</span>
                </div>
              </div>

              <div className="border-t border-border/80 pt-2.5 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Total Due</span>
                <span className="text-lg font-extrabold text-foreground font-mono">{fmt(invoice.total_amount)}</span>
              </div>

              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Total Paid</span>
                    <span className="font-mono">−{fmt(totalPaid)}</span>
                  </div>
                  <div className="border-t border-border/80 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Outstanding Balance</span>
                    <span
                      className={`text-lg font-extrabold font-mono ${
                        balance <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {balance <= 0 ? "Settled" : fmt(balance)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/80">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <DollarSign className="size-3.5 text-primary" /> Official Payment Receipts
              </h2>

              <div className="rounded-xl border border-border/80 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                      <th className="text-left px-5 py-3">Receipt #</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Date & Time</th>
                      <th className="text-left px-4 py-3">Payment Method</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Reference #</th>
                      <th className="text-right px-5 py-3">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoice.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-primary">
                          {payment.receipt_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {formatDateTime(payment.payment_date)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground">
                          {METHOD_LABELS[payment.method] ?? payment.method}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                          {payment.reference_number || "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {fmt(payment.amount_paid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        invoiceId={invoice.id}
        balance={balance > 0 ? balance : Number(invoice.total_amount)}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSuccess={() => {
          setShowPaymentDialog(false);
          router.refresh();
        }}
      />
    </div>
  );
}
