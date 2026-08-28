"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft, CheckCircle, XCircle, Loader2, CreditCard, Plus, X,
  ShieldCheck, AlertCircle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { usePermissions } from "@/components/layout/permissions-context";
import { can } from "@/lib/permissions";

const NO_PERMISSION_MSG = "This action is not under your permission list";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number | string;
  currency: string;
  transactionDate: string;
  type: string;
  method: string;
  status: string;
  reference: string | null;
  bankName: string | null;
  notes: string | null;
  rejectionReason: string | null;
  receiptNumber: string | null;
}

interface Sale {
  id: string;
  saleNumber: string;
  status: string;
  type: string;
  salePrice: string;
  discountAmount: string;
  finalPrice: string;
  currency: string;
  totalPaid: string;
  balanceDue: string;
  installmentMonths: number | null;
  downPayment: string | null;
  contractDate: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  property: { id: string; title: string; state: string; city: string | null; category: string; type: string };
  customer: { id: string; customerNumber: string; firstName: string | null; lastName: string | null; email: string; phone: string; whatsapp: string | null };
  reservation: { id: string; reservationNumber: string; reservationAmount: string } | null;
  salesAgent: { id: string; firstName: string; lastName: string; jobTitle: string | null } | null;
  payments: Payment[];
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  DRAFT:            { label: "Draft",            badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  PENDING_APPROVAL: { label: "Pending Approval", badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400" },
  APPROVED:         { label: "Approved",         badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400" },
  ACTIVE:           { label: "Active",           badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400" },
  DISPUTED:         { label: "Disputed",         badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400" },
  COMPLETED:        { label: "Completed",        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400" },
  CANCELLED:        { label: "Cancelled",        badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING_VERIFICATION: { label: "Pending",  cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400", icon: AlertCircle },
  VERIFIED:             { label: "Verified", cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",   icon: ShieldCheck },
  REJECTED:             { label: "Rejected", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",           icon: XCircle },
  REFUNDED:             { label: "Refunded", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",          icon: XCircle },
};

const SALE_TRANSITIONS: Record<string, { status: string; label: string; variant: "confirm" | "warn" | "cancel" }[]> = {
  DRAFT:            [
    { status: "PENDING_APPROVAL", label: "Submit for approval", variant: "confirm" },
    { status: "CANCELLED",        label: "Cancel sale",         variant: "cancel" },
  ],
  PENDING_APPROVAL: [
    { status: "APPROVED",  label: "Approve sale",    variant: "confirm" },
    { status: "CANCELLED", label: "Reject / Cancel", variant: "cancel" },
  ],
  APPROVED:         [
    { status: "ACTIVE",    label: "Mark as active", variant: "confirm" },
    { status: "CANCELLED", label: "Cancel sale",    variant: "cancel" },
  ],
  ACTIVE:           [
    { status: "COMPLETED", label: "Mark as completed", variant: "confirm" },
    { status: "DISPUTED",  label: "Flag as disputed",  variant: "warn" },
    { status: "CANCELLED", label: "Cancel sale",       variant: "cancel" },
  ],
  DISPUTED:         [
    { status: "ACTIVE",    label: "Resume sale", variant: "confirm" },
    { status: "CANCELLED", label: "Cancel sale", variant: "cancel" },
  ],
};

const PAYMENT_TYPES = ["RESERVATION","DEPOSIT","INSTALLMENT","OUTRIGHT","SERVICE_CHARGE","MAINTENANCE","REFUND","OTHER"];
const PAYMENT_METHODS = ["CASH","BANK_TRANSFER","CHEQUE","POS","OTHER"];

function fmtLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const SELECT_CLS = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const permissions = usePermissions();
  const canUpdateSale = can(permissions, "sale.update");
  const canApproveSale = can(permissions, "sale.approve");
  const canRecordPayment = can(permissions, "payment.create");
  const canVerifyPayment = can(permissions, "payment.verify");
  const [id, setId] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Record payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payType, setPayType] = useState("INSTALLMENT");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");
  const [payBank, setPayBank] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id: rid }) => {
      setId(rid);
      fetch(`/api/proxy/sales/${rid}`, { cache: "no-store" })
        .then(async (r) => { if (r.ok) { const d = await r.json(); if (d?.id) setSale(d); } })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [params]);

  function reload(rid: string) {
    fetch(`/api/proxy/sales/${rid}`, { cache: "no-store" })
      .then(async (r) => { if (r.ok) { const d = await r.json(); setSale(d); } })
      .catch(() => {});
  }

  function updateStatus(status: string) {
    if (!id) return;
    startTransition(async () => {
      const res = await fetch(`/api/proxy/sales/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes || undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSale((prev) => prev ? { ...prev, status: updated.status, approvedAt: updated.approvedAt } : prev);
        setFeedback({ type: "success", msg: `Status updated to ${STATUS_CONFIG[status]?.label ?? status}` });
        setNotes("");
      } else {
        const body = await res.json().catch(() => ({}));
        setFeedback({ type: "error", msg: body.message ?? "Update failed" });
      }
    });
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!sale) return;
    if (!payAmount || Number(payAmount) <= 0) { setPayError("Enter a valid amount"); return; }

    setPayError(null);
    setPaySubmitting(true);

    const res = await fetch("/api/proxy/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleId: sale.id,
        customerId: sale.customer.id,
        type: payType,
        method: payMethod,
        amount: Number(payAmount),
        reference: payRef || undefined,
        bankName: payBank || undefined,
        transactionDate: payDate,
        notes: payNotes || undefined,
      }),
    });

    setPaySubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setPayError(Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Failed to record payment"));
      return;
    }

    setShowPaymentForm(false);
    setPayAmount(""); setPayRef(""); setPayBank(""); setPayNotes("");
    setFeedback({ type: "success", msg: "Payment recorded — pending verification" });
    reload(id);
  }

  async function verifyPayment(paymentId: string) {
    const res = await fetch(`/api/proxy/payments/${paymentId}/verify`, { method: "PATCH" });
    if (res.ok) { setFeedback({ type: "success", msg: "Payment verified" }); reload(id); }
    else {
      const body = await res.json().catch(() => ({}));
      setFeedback({ type: "error", msg: body.message ?? "Verification failed" });
    }
  }

  async function rejectPayment(paymentId: string) {
    const reason = prompt("Reason for rejection (optional):") ?? "";
    const res = await fetch(`/api/proxy/payments/${paymentId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) { setFeedback({ type: "success", msg: "Payment rejected and totals reversed" }); reload(id); }
    else {
      const body = await res.json().catch(() => ({}));
      setFeedback({ type: "error", msg: body.message ?? "Rejection failed" });
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Sale not found.</p>
        <Link href="/sales" className="mt-4 inline-block text-sm text-secondary hover:underline">← Back to sales</Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[sale.status] ?? { label: sale.status, badgeClass: "bg-gray-100 text-gray-600" };
  const transitions = SALE_TRANSITIONS[sale.status] ?? [];
  const customerName = [sale.customer.firstName, sale.customer.lastName].filter(Boolean).join(" ") || "—";
  const agentName = sale.salesAgent ? [sale.salesAgent.firstName, sale.salesAgent.lastName].filter(Boolean).join(" ") : null;
  const balanceDue = Number(sale.balanceDue);
  const discount = Number(sale.discountAmount);

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <Link href="/sales" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Sales
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>{cfg.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{sale.saleNumber}</span>
          </div>
          <h1 className="text-xl font-bold">{sale.property.title}</h1>
          <p className="text-sm text-muted-foreground">{sale.property.city ? `${sale.property.city}, ` : ""}{sale.property.state}</p>
        </div>
        <Link href={`/properties/${sale.property.id}`} className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
          View property →
        </Link>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${feedback.type === "success" ? "border-green-700/30 bg-green-900/20 text-green-400" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {feedback.msg}
          <button className="ml-auto" onClick={() => setFeedback(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Customer</h2>
          <div className="space-y-1">
            <p className="font-semibold">{customerName}</p>
            <p className="text-sm text-muted-foreground">{sale.customer.email}</p>
            <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>
            {sale.customer.whatsapp && <p className="text-sm text-muted-foreground">WhatsApp: {sale.customer.whatsapp}</p>}
            <p className="text-xs text-muted-foreground font-mono">{sale.customer.customerNumber}</p>
          </div>
          <Link href={`/customers/${sale.customer.id}`} className="text-sm text-secondary hover:underline">View customer profile →</Link>
        </div>

        {/* Financials */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Financials</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sale price</span>
              <span>{formatCurrency(sale.salePrice)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-red-500">- {formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Final price</span>
              <span className="text-primary">{formatCurrency(sale.finalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total paid</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(sale.totalPaid)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Balance due</span>
              <span className={balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
                {balanceDue > 0 ? formatCurrency(sale.balanceDue) : "Fully paid"}
              </span>
            </div>
            {sale.downPayment && Number(sale.downPayment) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Down payment</span>
                <span>{formatCurrency(sale.downPayment)}</span>
              </div>
            )}
            {sale.installmentMonths && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installment period</span>
                <span>{sale.installmentMonths} months</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sale details */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Sale Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Type</p>
            <p className="font-medium capitalize">{sale.type.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Created</p>
            <p className="font-medium">{formatDate(sale.createdAt)}</p>
          </div>
          {sale.approvedAt && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Approved</p>
              <p className="font-medium text-green-600 dark:text-green-400">{formatDate(sale.approvedAt)}</p>
            </div>
          )}
          {sale.contractDate && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Contract date</p>
              <p className="font-medium">{formatDate(sale.contractDate)}</p>
            </div>
          )}
          {agentName && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Sales agent</p>
              <p className="font-medium">{agentName}</p>
              {sale.salesAgent?.jobTitle && <p className="text-xs text-muted-foreground">{sale.salesAgent.jobTitle}</p>}
            </div>
          )}
          {sale.reservation && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">From reservation</p>
              <Link href={`/reservations/${sale.reservation.id}`} className="font-mono text-xs text-secondary hover:underline">
                {sale.reservation.reservationNumber}
              </Link>
            </div>
          )}
        </div>
        {sale.notes && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{sale.notes}</p>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2 border-b">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Payment History</h2>
          <span className="text-xs text-muted-foreground ml-1">{sale.payments.length} payment{sale.payments.length !== 1 ? "s" : ""}</span>
          <button
            onClick={() => canRecordPayment && setShowPaymentForm((v) => !v)}
            disabled={!canRecordPayment}
            title={!canRecordPayment ? NO_PERMISSION_MSG : undefined}
            className={`ml-auto flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showPaymentForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showPaymentForm ? "Cancel" : "Record payment"}
          </button>
        </div>

        {/* Record payment form */}
        {showPaymentForm && (
          <form onSubmit={submitPayment} className="px-5 py-4 border-b bg-muted/30 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New payment entry</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Amount (₦)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <select value={payType} onChange={(e) => setPayType(e.target.value)} className={SELECT_CLS}>
                  {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{fmtLabel(t)}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={SELECT_CLS}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{fmtLabel(m)}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Transaction date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reference / Teller no.</label>
                <input
                  type="text"
                  placeholder="e.g. TRF/2024/00123"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Bank name</label>
                <input
                  type="text"
                  placeholder="e.g. GTBank"
                  value={payBank}
                  onChange={(e) => setPayBank(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Notes (optional)</label>
              <input
                type="text"
                placeholder="Any additional details…"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {payError && <p className="text-xs text-destructive">{payError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={paySubmitting}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {paySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {paySubmitting ? "Recording…" : "Record payment"}
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Payment rows */}
        {sale.payments.length === 0 && !showPaymentForm && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No payments recorded yet.{" "}
            <button onClick={() => setShowPaymentForm(true)} className="text-secondary hover:underline">Record the first one.</button>
          </div>
        )}
        <div className="divide-y">
          {sale.payments.map((p) => {
            const pCfg = PAYMENT_STATUS_CONFIG[p.status] ?? PAYMENT_STATUS_CONFIG.PENDING_VERIFICATION;
            const PIcon = pCfg.icon;
            return (
              <div key={p.id} className="px-5 py-3.5 flex items-start justify-between gap-4 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold">{formatCurrency(p.amount)}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pCfg.cls}`}>
                      <PIcon className="h-3 w-3" />
                      {pCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fmtLabel(p.type)} · {fmtLabel(p.method)}
                    {p.bankName ? ` · ${p.bankName}` : ""}
                    {p.reference ? ` · Ref: ${p.reference}` : ""}
                  </p>
                  {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
                  {p.rejectionReason && <p className="text-xs text-destructive mt-0.5">Rejected: {p.rejectionReason}</p>}
                  {p.receiptNumber && <p className="text-xs font-mono text-muted-foreground mt-0.5">{p.receiptNumber}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDate(p.transactionDate)}</p>
                  {p.status === "PENDING_VERIFICATION" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => canVerifyPayment && verifyPayment(p.id)}
                        disabled={!canVerifyPayment}
                        title={!canVerifyPayment ? NO_PERMISSION_MSG : undefined}
                        className="rounded bg-green-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => canVerifyPayment && rejectPayment(p.id)}
                        disabled={!canVerifyPayment}
                        title={!canVerifyPayment ? NO_PERMISSION_MSG : undefined}
                        className="rounded border border-red-500/40 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Update Status</h2>
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for decision, next steps, additional context…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {transitions.map((t) => {
              const hasAccess = t.status === "APPROVED" ? canApproveSale : canUpdateSale;
              return (
              <button
                key={t.status}
                onClick={() => hasAccess && updateStatus(t.status)}
                disabled={isPending || !hasAccess}
                title={!hasAccess ? NO_PERMISSION_MSG : undefined}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  t.variant === "confirm" ? "bg-green-600 text-white hover:bg-green-700"
                  : t.variant === "warn" ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-red-600 text-white hover:bg-red-700"
                } ${!hasAccess ? "cursor-not-allowed" : ""}`}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.variant === "confirm" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {t.label}
              </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
