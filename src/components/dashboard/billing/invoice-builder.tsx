"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Trash2,
  Receipt,
  Loader2,
  ChevronLeft,
  Calendar,
  User,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createInvoice, addInvoiceItem, finalizeInvoice } from "@/services/billing";
import Link from "next/link";

interface Owner {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  isVatable: boolean;
}

const VAT_RATE = 0.12;

function calcTotals(items: LineItem[]) {
  let vatableSales = 0;
  let vatExemptSales = 0;

  for (const item of items) {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
    if (item.isVatable) {
      vatableSales += lineTotal;
    } else {
      vatExemptSales += lineTotal;
    }
  }

  const vatAmount = vatableSales * VAT_RATE;
  const total = vatableSales + vatAmount + vatExemptSales;
  return { vatableSales, vatExemptSales, vatAmount, total };
}

export function InvoiceBuilder({ owners }: { owners: Owner[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, isVatable: true },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"draft" | "finalize">("draft");

  const addLine = () =>
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, isVatable: true },
    ]);

  const removeLine = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const updateLine = <K extends keyof LineItem>(idx: number, key: K, value: LineItem[K]) =>
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );

  const { vatableSales, vatExemptSales, vatAmount, total } = calcTotals(lineItems);

  const fmt = (n: number) =>
    n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  async function handleSubmit(mode: "draft" | "finalize") {
    setError(null);
    setSaveMode(mode);

    if (!ownerId) {
      setError("Please select a client/owner.");
      return;
    }
    if (lineItems.some((item) => !item.description.trim())) {
      setError("All line items must have a description.");
      return;
    }

    startTransition(async () => {
      try {
        const invoice = await createInvoice({
          ownerId,
          dueDate: dueDate || undefined,
        });

        for (const item of lineItems) {
          if (item.description.trim()) {
            await addInvoiceItem(invoice.id, item);
          }
        }

        if (mode === "finalize") {
          await finalizeInvoice(invoice.id);
        }

        router.push(`/dashboard/billing/${invoice.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Invoices
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Invoice</h1>
              <p className="text-xs text-muted-foreground">
                Issue a new official billing invoice for veterinary services and treatments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Unified Invoice Sheet */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Top Decorative Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Client & Date Metadata */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <User className="size-3.5 text-primary" /> Client & Invoice Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="owner-select" className="text-sm font-medium text-foreground">
                  Client / Pet Owner <span className="text-destructive">*</span>
                </label>
                <select
                  id="owner-select"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="flex min-h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a registered client...</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.full_name ?? "Unnamed"} {o.email ? `(${o.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="due-date" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Due Date <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex min-h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/70" />

          {/* Section 2: Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Receipt className="size-3.5 text-primary" /> Billed Items & Services
              </h2>
              <span className="text-xs text-muted-foreground">
                {lineItems.length} {lineItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/20 overflow-hidden">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_90px_130px_90px_40px] gap-3 px-4 py-3 bg-muted/50 border-b border-border/80 text-xs font-semibold text-muted-foreground">
                <span>Description / Service</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit Price (₱)</span>
                <span className="text-center">VATable?</span>
                <span />
              </div>

              {/* Items */}
              <div className="divide-y divide-border/60 p-2 sm:p-0">
                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_90px_130px_90px_40px] gap-3 sm:px-4 sm:py-3 items-center"
                  >
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden mb-1 block">Description</span>
                      <input
                        placeholder="e.g. Consultation, Vaccination, Antibiotics"
                        value={item.description}
                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Description"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden mb-1 block">Qty</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(e) => updateLine(idx, "quantity", Math.max(1, Number(e.target.value)))}
                        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-center text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Quantity"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden mb-1 block">Unit Price (₱)</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice || ""}
                        placeholder="0.00"
                        onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-right text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Unit Price"
                      />
                    </div>
                    <div className="flex sm:justify-center items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">VATable:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isVatable}
                          onChange={(e) => updateLine(idx, "isVatable", e.target.checked)}
                          className="size-4 rounded border-input accent-primary cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground sm:hidden">12% VAT</span>
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lineItems.length === 1}
                        aria-label="Remove line"
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-20 transition-all"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLine}
                className="gap-2 rounded-xl text-xs font-medium min-h-10 hover:bg-muted"
              >
                <PlusCircle className="size-3.5 text-primary" />
                Add Line Item
              </Button>
            </div>
          </div>

          <div className="border-t border-border/70" />

          {/* Section 3: Totals & Tax Breakdown */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 max-w-sm text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="size-3.5 text-primary" /> BIR Tax Summary
              </div>
              <p>
                VAT (12%) is applied to all VATable items automatically. Finalizing this invoice locks it for billing and generates the official invoice sequence number.
              </p>
            </div>

            <div className="w-full md:max-w-xs space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>VATable Sales</span>
                  <span className="font-semibold text-foreground">{fmt(vatableSales)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT Exempt Sales</span>
                  <span className="font-semibold text-foreground">{fmt(vatExemptSales)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (12%)</span>
                  <span className="font-semibold text-foreground">{fmt(vatAmount)}</span>
                </div>
              </div>
              <div className="border-t border-border/80 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Total Due</span>
                <span className="text-xl font-extrabold text-primary font-mono">{fmt(total)}</span>
              </div>
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
        </div>

        {/* Action Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isPending}
            className="w-full sm:w-auto min-h-11 rounded-xl font-medium"
          >
            {isPending && saveMode === "draft" && (
              <Loader2 className="size-4 animate-spin mr-2" />
            )}
            Save as Draft
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit("finalize")}
            disabled={isPending}
            className="w-full sm:w-auto min-h-11 rounded-xl font-semibold gap-2"
          >
            {isPending && saveMode === "finalize" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Finalize Invoice
          </Button>
        </div>
      </Card>
    </div>
  );
}
