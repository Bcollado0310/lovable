import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const currencyMeta: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "\u20AC", locale: "de-DE" },
  GBP: { symbol: "\u00A3", locale: "en-GB" }
};

const getCurrencyMeta = (currency: string) => {
  const upper = currency.toUpperCase();
  return currencyMeta[upper] ?? currencyMeta.USD;
};

const getPreferredCurrency = (fallback: string) => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem("investment-filters");
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return (parsed?.currency ?? fallback).toUpperCase();
  } catch {
    return fallback;
  }
};

interface InvestNowDialogProps {
  property: {
    id: string;
    title: string;
    minimum_investment: number;
    expected_annual_return: number;
    target_funding: number;
    current_funding: number;
    property_status: string;
    currency?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmount?: number;
}

export function InvestNowDialog({
  property,
  open,
  onOpenChange,
  defaultAmount
}: InvestNowDialogProps) {
  const currency = getPreferredCurrency(property.currency ?? "USD");
  const { symbol, locale } = getCurrencyMeta(currency);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale]
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }),
    [locale, currency]
  );
  const [amountInput, setAmountInput] = useState(
    defaultAmount && defaultAmount > 0
      ? String(Math.round(defaultAmount))
      : "0"
  );
  const [acknowledgeDocs, setAcknowledgeDocs] = useState(false);
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amount = amountInput === "" ? 0 : Number(amountInput);
  const remainingAllocation = Math.max(
    property.target_funding - property.current_funding,
    0
  );
  const isSoldOut =
    remainingAllocation <= 0 || property.property_status === "fully_funded";

  const maxInvestment = useMemo(() => {
    const buffer = property.minimum_investment * 20;
    const computedMax = Math.max(
      buffer,
      remainingAllocation > 0 ? remainingAllocation : buffer
    );
    return computedMax;
  }, [remainingAllocation, property.minimum_investment]);

  const minInvestment = property.minimum_investment;

  useEffect(() => {
    if (open) {
      const defaultBase =
        typeof defaultAmount === "number" && defaultAmount > 0
          ? defaultAmount
          : 0;
      const boundedAmount = Math.min(
        Math.max(defaultBase || minInvestment, minInvestment),
        maxInvestment
      );
      setAmountInput(defaultBase ? String(Math.round(boundedAmount)) : "0");
      setAcknowledgeDocs(false);
      setAcknowledgeRisk(false);
      setSubmitted(false);
      setConfirmOpen(false);
    }
  }, [open, defaultAmount, minInvestment, maxInvestment]);

  const formattedAmount = currencyFormatter.format(
    Math.max(Math.round(amount), 0)
  );
  const intentAmount = Math.max(amount, minInvestment);
  const formattedAmountInput =
    amountInput === "" ? "" : numberFormatter.format(Number(amountInput));
  const allocationPercent =
    maxInvestment > 0
      ? Math.min(Math.round((amount / maxInvestment) * 100), 100)
      : 0;

  const projectedReturns = useMemo(() => {
    const annualIncome = (amount * property.expected_annual_return) / 100;
    const equityMultiple = 1.8;
    const totalReturn = amount * equityMultiple;
    const profit = totalReturn - amount;

    return {
      annualIncome,
      monthlyIncome: annualIncome / 12,
      totalReturn,
      profit,
      equityMultiple
    };
  }, [amount, property.expected_annual_return]);

  const successTitle = isSoldOut
    ? "Waitlist Request Submitted"
    : "Investment Intent Registered";
  const successDescription = isSoldOut
    ? `You have been added to the waitlist for ${property.title}. We will notify you if allocation becomes available.`
    : `Our team will reach out shortly to finalize your commitment and next steps for ${property.title}.`;
  const successPrimaryCta = isSoldOut ? "Back to Opportunities" : "Go to Portfolio";
  const confirmTitle = isSoldOut ? "Join the Waitlist?" : "Confirm Investment?";
  const confirmDescription = isSoldOut
    ? `You're about to request a waitlist spot with an intent to invest ${currencyFormatter.format(
        intentAmount
      )}. We'll notify you as soon as allocation opens up.`
    : `You're about to invest ${currencyFormatter.format(
        intentAmount
      )} into ${property.title}. Please confirm you want to proceed.`;
  const confirmActionLabel = isSoldOut ? "Yes, Join Waitlist" : "Yes, Invest";

  const canSubmit =
    amount >= minInvestment && acknowledgeDocs && acknowledgeRisk;

  const handleAmountInputChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "");
    if (sanitized === "") {
      setAmountInput("");
      return;
    }
    const numeric = Number(sanitized);
    if (Number.isNaN(numeric)) {
      return;
    }
    const bounded = Math.min(numeric, maxInvestment);
    setAmountInput(String(bounded));
  };

  const openConfirmDialog = () => {
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    setSubmitted(true);
  };

  const handleClose = (state: boolean) => {
    if (!state) {
      setTimeout(() => {
        setSubmitted(false);
      }, 200);
    }
    onOpenChange(state);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-glass-border w-full max-w-3xl overflow-hidden p-0 shadow-[0_24px_80px_-30px_hsl(var(--primary)/0.6)]">
        {submitted ? (
          <div className="space-y-5 px-8 pb-10 pt-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg">{successTitle}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground/90">
                {successDescription}
              </DialogDescription>
            </div>

            <div className="rounded-xl border border-glass-border bg-muted/10 p-4 text-left">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Investment Summary
              </h4>
              <div className="grid gap-2.5 text-xs sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">Amount</div>
                  <div className="text-base font-semibold text-primary">
                    {formattedAmount}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">Projected Profit</div>
                  <div className="text-base font-semibold text-green-400">
                    {currencyFormatter.format(
                      Math.round(projectedReturns.profit)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">Equity Multiple</div>
                  <div className="text-base font-semibold">
                    {projectedReturns.equityMultiple.toFixed(1)}x
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">Annual Yield</div>
                  <div className="text-base font-semibold text-primary">
                    {property.expected_annual_return}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                className="glass border-glass-border"
                onClick={() => handleClose(false)}
              >
                Close
              </Button>
              <Button className="bg-gradient-primary hover:shadow-neon">
                {successPrimaryCta}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1.5 border-b border-glass-border bg-background/80 px-8 pb-6 pt-8 backdrop-blur">
              <DialogTitle className="text-lg font-semibold">
                Invest in {property.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Confirm your commitment, choose your allocation, and review
                required disclosures before investing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-8 pb-10 pt-6">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="invest-amount"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <DollarSign className="h-4 w-4 text-primary" />
                    Commitment Amount
                  </Label>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Minimum {currencyFormatter.format(minInvestment)}
                  </span>
                </div>

                <div className="relative">
                  <Input
                    id="invest-amount"
                    value={formattedAmountInput}
                    onChange={(event) => handleAmountInputChange(event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    className="glass border-glass-border bg-background/60 pl-8 pr-4 text-sm font-semibold tracking-tight"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    {symbol}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative h-1 w-full rounded-full bg-muted/40">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary transition-all duration-300"
                      style={{ width: `${allocationPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{currencyFormatter.format(minInvestment)}</span>
                    <span className="font-medium text-foreground">
                      {allocationPercent}% allocation
                    </span>
                    <span>{currencyFormatter.format(maxInvestment)}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() => setAmountInput("")}
                  >
                    Reset
                  </Button>
                </div>
              </section>

              <Separator className="bg-glass-border" />

              <section className="grid gap-3 rounded-xl border border-glass-border/80 bg-background/60 p-4 md:grid-cols-2">
                <SummaryTile
                  icon={<TrendingUp className="h-4 w-4 text-primary" />}
                  label="Projected Profit"
                  value={currencyFormatter.format(
                    Math.round(projectedReturns.profit)
                  )}
                  sublabel={`${projectedReturns.equityMultiple.toFixed(
                    1
                  )}x equity multiple`}
                />
                <SummaryTile
                  icon={<Sparkles className="h-4 w-4 text-green-400" />}
                  label="Annual Income"
                  value={currencyFormatter.format(
                    Math.round(projectedReturns.annualIncome)
                  )}
                  sublabel={`~ ${currencyFormatter.format(
                    Math.round(projectedReturns.monthlyIncome)
                  )} per month`}
                />
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Before You Commit
                </h3>
                <DisclosureRow
                  checked={acknowledgeDocs}
                  onCheckedChange={setAcknowledgeDocs}
                  icon={<FileText className="h-4 w-4 text-primary" />}
                  title="I reviewed the Subscription Agreement & PPM"
                  description="You confirm reading the investment documents outlining structure, fees, and risks."
                />
                <DisclosureRow
                  checked={acknowledgeRisk}
                  onCheckedChange={setAcknowledgeRisk}
                  icon={<ShieldCheck className="h-4 w-4 text-green-400" />}
                  title="I understand the risks and lock-up period"
                  description="Real estate investments are illiquid and principal is at risk. You acknowledge this commitment."
                />
              </section>

              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-100 sm:text-[13px]">
                By continuing, you submit a non-binding indication of interest.
                Final documentation will be required to complete your
                investment.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Available allocation remaining:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      isSoldOut ? "text-yellow-400" : "text-foreground"
                    )}
                  >
                    {currencyFormatter.format(remainingAllocation)}
                  </span>
                  {isSoldOut && (
                    <span className="ml-2 text-yellow-500">
                      deal currently fully allocated
                    </span>
                  )}
                </div>
                <Button
                  className={cn(
                    "bg-gradient-primary hover:shadow-neon",
                    !canSubmit && "opacity-60"
                  )}
                  disabled={!canSubmit}
                  onClick={openConfirmDialog}
                >
                  {isSoldOut ? "Join Waitlist" : `Invest ${formattedAmount}`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="glass-card border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  sublabel
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border border-glass-border bg-background/50 p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{sublabel}</div>
    </div>
  );
}

function DisclosureRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-transparent px-3 py-1.5 transition hover:border-primary/40 hover:bg-primary/5">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-1"
      />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-foreground">
            {title}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </label>
  );
}
