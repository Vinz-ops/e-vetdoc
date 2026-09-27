"use client";

import * as React from "react";
import {
  Receipt,
  Search,
  Calendar,
  CreditCard,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  FileText,
  DollarSign,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOwnerInvoices, type InvoiceWithDetails } from "@/services/billing";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return "₱0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₱0.00";
  return `₱${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partially Paid",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: Clock,
  },
  unpaid: {
    label: "Payment Due",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: AlertCircle,
  },
  draft: {
    label: "Draft",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    icon: Clock,
  },
  voided: {
    label: "Voided",
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    icon: X,
  },
};

import { printOfficialReceipt, getPaidAmount } from "@/lib/print-receipt";

export function OwnerBillingTab() {
  const [invoices, setInvoices] = React.useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const fetchInvoices = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getOwnerInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load owner invoices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = React.useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.payments.some((p) => (p.receipt_number && p.receipt_number.toLowerCase().includes(q))) ||
        inv.invoice_items.some((item) => item.description.toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const summary = React.useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      const total = Number(inv.total_amount) || 0;
      const paid = getPaidAmount(inv);
      totalBilled += total;
      totalPaid += paid;
      if (inv.status === "paid") {
        paidCount++;
      }
    }

    return { totalBilled, totalPaid, totalCount: invoices.length, paidCount };
  }, [invoices]);

  const handlePrint = (invoice: InvoiceWithDetails) => {
    printOfficialReceipt(invoice);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices & Receipts</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {invoices.length} invoices
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Review your veterinary invoices, itemized care breakdowns, and official payment receipts.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchInvoices(true)}
          disabled={refreshing || loading}
          className="min-h-10 px-3.5 rounded-xl gap-2 font-semibold shadow-xs hover:bg-muted self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Total Invoiced</div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{formatCurrency(summary.totalBilled)}</div>
        </Card>
        <Card className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-2xs">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Paid & Settled</div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{formatCurrency(summary.totalPaid)}</div>
        </Card>
        <Card className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-2xs">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Invoices & Receipts</div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">
            {summary.totalCount} <span className="text-xs font-normal text-muted-foreground">({summary.paidCount} Settled)</span>
          </div>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice #, receipt #, or service..."
          className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-9 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Invoice List */}
      {loading ? (
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Loading invoices and payment receipts...</p>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Receipt className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No invoices found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {search ? "No records matched your search query." : "You have no invoices or payment records yet."}
              </p>
            </div>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch("")} className="mt-1 rounded-xl text-xs cursor-pointer">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((inv) => {
            const isExpanded = expandedId === inv.id;
            const statusConfig = STATUS_CONFIG[inv.status] || STATUS_CONFIG.issued;
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={inv.id}
                className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                  isExpanded ? "border-primary/40 shadow-xs" : "border-border bg-card hover:border-border/80"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 cursor-pointer hover:bg-muted/20 select-none transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm font-mono text-foreground">{inv.invoice_number}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <StatusIcon className="size-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="size-3" />
                        <span>Issued {formatDate(inv.created_at)}</span>
                        {inv.payments.length > 0 && inv.payments[0].receipt_number && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-foreground font-medium">
                              Receipt #{inv.payments[0].receipt_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-bold font-mono text-foreground">{formatCurrency(inv.total_amount)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {inv.status === "paid"
                          ? "Fully Settled"
                          : `Paid: ${formatCurrency(getPaidAmount(inv))}`}
                      </div>
                    </div>
                    <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-5 space-y-5 animate-in fade-in duration-150">
                    {/* Itemized Services Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Itemized Care & Services
                      </h4>
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                              <th className="text-left py-2.5 px-3">Description</th>
                              <th className="text-right py-2.5 px-3">Qty</th>
                              <th className="text-right py-2.5 px-3">Unit Price</th>
                              <th className="text-right py-2.5 px-3">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {inv.invoice_items.map((item) => {
                              const lineTotal = item.quantity * item.unit_price;
                              return (
                                <tr key={item.id} className="hover:bg-muted/10">
                                  <td className="py-2.5 px-3 font-medium text-foreground">{item.description}</td>
                                  <td className="py-2.5 px-3 text-right font-mono">{item.quantity}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                    {formatCurrency(item.unit_price)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                    {formatCurrency(lineTotal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financial Summary & Payment Receipts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Payment Receipts */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-primary" />
                          Payment Records & Receipts
                        </h4>
                        {inv.payments.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No payments recorded yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {inv.payments.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs"
                              >
                                <div>
                                  <div className="font-semibold text-foreground font-mono">
                                    {p.receipt_number || "Official Receipt"}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground capitalize">
                                    {p.method.replace("_", " ")} · {formatDate(p.payment_date)}
                                  </div>
                                </div>
                                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(p.amount_paid)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Financial Totals Calculation */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Invoice Summary
                        </h4>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatCurrency(Number(inv.total_amount) - (Number(inv.vat_amount) || 0))}
                          </span>
                        </div>
                        {Number(inv.vat_amount || 0) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>VAT (12%)</span>
                            <span className="font-mono font-medium text-foreground">{formatCurrency(inv.vat_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border font-bold text-sm text-foreground">
                          <span>Total Amount</span>
                          <span className="font-mono text-primary">{formatCurrency(inv.total_amount)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>Amount Paid</span>
                          <span className="font-mono">{formatCurrency(getPaidAmount(inv))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Print Action Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(inv);
                        }}
                        className="rounded-xl gap-2 text-xs font-semibold cursor-pointer"
                      >
                        <Printer className="size-3.5" />
                        Print Official Receipt
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
