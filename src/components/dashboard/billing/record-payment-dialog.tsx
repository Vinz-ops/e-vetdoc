"use client";

import { useState, useTransition } from "react";
import { Loader2, X, Receipt, CreditCard, Banknote, Smartphone, Building, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { recordPayment } from "@/services/billing";

interface RecordPaymentDialogProps {
  invoiceId: string;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "gcash", label: "GCash", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building },
] as const;

type PaymentMethod = (typeof METHODS)[number]["value"];

export function RecordPaymentDialog({
  invoiceId,
  balance,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2) : "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    startTransition(async () => {
      try {
        await recordPayment({
          invoiceId,
          amountPaid: parsedAmount,
          method,
          referenceNumber: referenceNumber.trim() || undefined,
        });
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record payment.");
      }
    });
  }

  const showRefField = method !== "cash";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500/80 via-emerald-500 to-emerald-500/80" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Record Payment</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Outstanding Balance:{" "}
                <span className="font-semibold text-foreground font-mono">
                  ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Amount with distinct currency addon */}
            <div className="space-y-1.5">
              <label htmlFor="payment-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount to Pay <span className="text-destructive">*</span>
              </label>
              <div className="flex rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-all">
                <span className="flex items-center justify-center bg-muted/60 px-4 text-sm font-bold text-muted-foreground border-r border-border/80 select-none">
                  ₱
                </span>
                <input
                  id="payment-amount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="min-h-12 w-full bg-transparent px-3.5 text-base font-bold font-mono text-foreground outline-none border-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Method Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Method <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const isSelected = method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference Number */}
            {showRefField && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label htmlFor="ref-number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reference Number <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  id="ref-number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={method === "gcash" ? "e.g. 10049281928" : "e.g. TXN-92819"}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="min-h-11 rounded-xl font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-h-11 rounded-xl font-semibold gap-2 cursor-pointer"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirm Payment
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
