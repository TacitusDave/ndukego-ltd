"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, XCircle, Loader2, Receipt, Clock } from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { usePermissions } from "@/components/layout/permissions-context";
import { can } from "@/lib/permissions";

const NO_PERMISSION_MSG = "This action is not under your permission list";

interface Reservation {
  id: string;
  reservationNumber: string;
  status: string;
  reservationAmount: string;
  currency: string;
  reservedAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  customer: {
    id: string;
    customerNumber: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string;
    whatsapp: string | null;
    status: string;
  };
  property: {
    id: string;
    title: string;
    state: string;
    city: string | null;
    listingPrice: string | null;
    reservationAmount: string | null;
    category: string;
    type: string;
    media: { url: string }[];
  };
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  PENDING:           { label: "Pending Review",   badgeClass: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:         { label: "Confirmed",         badgeClass: "bg-green-100 text-green-800" },
  EXPIRED:           { label: "Expired",           badgeClass: "bg-gray-100 text-gray-600" },
  CANCELLED:         { label: "Cancelled",         badgeClass: "bg-red-100 text-red-700" },
  CONVERTED_TO_SALE: { label: "Converted to Sale", badgeClass: "bg-blue-100 text-blue-800" },
};

const TRANSITIONS: Record<string, { status: string; label: string; variant: "confirm" | "cancel" }[]> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirm reservation", variant: "confirm" },
    { status: "CANCELLED", label: "Cancel reservation",  variant: "cancel" },
  ],
  CONFIRMED: [
    { status: "CANCELLED", label: "Cancel reservation", variant: "cancel" },
  ],
};

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const permissions = usePermissions();
  const canUpdateReservation = can(permissions, "reservation.update");
  const canCancelReservation = can(permissions, "reservation.cancel");
  const canCreateSale = can(permissions, "sale.create");
  const [id, setId] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  // Timeline
  const [timeline, setTimeline] = useState<AuditEntry[]>([]);

  interface AuditEntry {
    id: string;
    action: string;
    actorEmail: string | null;
    oldValues: Record<string,unknown> | null;
    newValues: Record<string,unknown> | null;
    createdAt: string;
  }
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sale conversion form state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [saleType, setSaleType] = useState("OUTRIGHT");
  const [saleDiscount, setSaleDiscount] = useState("0");
  const [saleNotes, setSaleNotes] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);
      fetch(`/api/proxy/reservations/${resolvedId}`, { cache: "no-store" })
        .then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            if (d?.id) {
              setReservation(d);
              if (d.property?.listingPrice) setSalePrice(d.property.listingPrice);
              // Fetch timeline
              fetch(`/api/proxy/reservations/${resolvedId}/timeline`)
                .then((r) => r.ok ? r.json() : null)
                .then((audit) => { if (audit?.items) setTimeline(audit.items); })
                .catch(() => {});
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [params]);

  function updateStatus(status: string) {
    if (!id) return;
    startTransition(async () => {
      const res = await fetch(`/api/proxy/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes || undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReservation((prev) =>
          prev ? { ...prev, status: updated.status, confirmedAt: updated.confirmedAt, cancelledAt: updated.cancelledAt } : prev,
        );
        setFeedback({ type: "success", msg: `Status updated to ${STATUS_CONFIG[status]?.label ?? status}` });
        setNotes("");
      } else {
        const body = await res.json().catch(() => ({}));
        setFeedback({ type: "error", msg: body.message ?? "Update failed" });
      }
    });
  }

  async function convertToSale() {
    if (!id || !reservation) return;
    const price = parseFloat(salePrice);
    if (!price || price <= 0) {
      setFeedback({ type: "error", msg: "Enter a valid sale price." });
      return;
    }
    setConverting(true);
    setFeedback(null);
    try {
      // 1. Create the sale record
      const saleRes = await fetch("/api/proxy/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: reservation.property.id,
          customerId: reservation.customer.id,
          reservationId: reservation.id,
          type: saleType,
          salePrice: price,
          discountAmount: parseFloat(saleDiscount) || 0,
          notes: saleNotes || undefined,
        }),
      });
      if (!saleRes.ok) {
        const body = await saleRes.json().catch(() => ({}));
        setFeedback({ type: "error", msg: body.message ?? "Failed to create sale." });
        return;
      }
      const sale = await saleRes.json();

      // 2. Mark reservation as converted
      await fetch(`/api/proxy/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONVERTED_TO_SALE" }),
      });

      // 3. Navigate to the new sale
      router.push(`/sales/${sale.id}`);
    } catch {
      setFeedback({ type: "error", msg: "Cannot reach server." });
    } finally {
      setConverting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Reservation not found.</p>
        <Link href="/reservations" className="mt-4 inline-block text-sm text-secondary hover:underline">
          ← Back to reservations
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[reservation.status] ?? { label: reservation.status, badgeClass: "bg-gray-100 text-gray-600" };
  const transitions = TRANSITIONS[reservation.status] ?? [];
  const customerName = [reservation.customer.firstName, reservation.customer.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <Link href="/reservations" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Reservations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
              {cfg.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{reservation.reservationNumber}</span>
          </div>
          <h1 className="text-xl font-bold">{reservation.property.title}</h1>
          <p className="text-sm text-muted-foreground">
            {reservation.property.city ? `${reservation.property.city}, ` : ""}{reservation.property.state}
          </p>
        </div>
        <Link
          href={`/properties/${reservation.property.id}`}
          className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          View property →
        </Link>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${feedback.type === "success" ? "border-green-700/30 bg-green-900/20 text-green-400" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Customer</h2>
          <div className="space-y-1">
            <p className="font-semibold">{customerName}</p>
            <p className="text-sm text-muted-foreground">{reservation.customer.email}</p>
            <p className="text-sm text-muted-foreground">{reservation.customer.phone}</p>
            {reservation.customer.whatsapp && (
              <p className="text-sm text-muted-foreground">WhatsApp: {reservation.customer.whatsapp}</p>
            )}
            <p className="text-xs text-muted-foreground font-mono">{reservation.customer.customerNumber}</p>
          </div>
          <Link href={`/customers/${reservation.customer.id}`} className="text-sm text-secondary hover:underline">
            View customer profile →
          </Link>
        </div>

        {/* Reservation details */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Reservation Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>{cfg.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reserved on</span>
              <span>{formatDate(reservation.reservedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span className={reservation.status === "PENDING" ? "text-amber-500" : ""}>{formatDate(reservation.expiresAt)}</span>
            </div>
            {reservation.confirmedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmed</span>
                <span className="text-green-600">{formatDate(reservation.confirmedAt)}</span>
              </div>
            )}
            {reservation.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled</span>
                <span className="text-red-500">{formatDate(reservation.cancelledAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reservation fee</span>
              <span className="font-semibold">
                {Number(reservation.reservationAmount) > 0 ? formatCurrency(reservation.reservationAmount) : "—"}
              </span>
            </div>
            {reservation.property.listingPrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listing price</span>
                <span className="font-semibold text-primary">{formatCurrency(reservation.property.listingPrice)}</span>
              </div>
            )}
          </div>
          {reservation.notes && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-1">Customer message</p>
              <p className="text-sm">{reservation.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Convert to Sale — only shown when CONFIRMED and user has sale.create */}
      {reservation.status === "CONFIRMED" && (
        <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Convert to Sale</h2>
            </div>
            {canCreateSale ? (
              <button
                onClick={() => setShowSaleForm((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showSaleForm ? "Hide" : "Create sale record →"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground cursor-not-allowed" title={NO_PERMISSION_MSG}>
                Create sale record →
              </span>
            )}
          </div>

          {showSaleForm && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                This creates a Sale record linked to this reservation and marks it as Converted to Sale.
                You will be taken to the sale page to manage payments and status.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Sale price (₦) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Discount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleDiscount}
                    onChange={(e) => setSaleDiscount(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sale type</label>
                  <select
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="OUTRIGHT">Outright</option>
                    <option value="INSTALLMENT">Installment</option>
                    <option value="MORTGAGE">Mortgage</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes (optional)</label>
                  <input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Contract terms, agreed conditions…"
                  />
                </div>
              </div>
              {salePrice && parseFloat(saleDiscount) >= 0 && (
                <p className="text-sm text-muted-foreground">
                  Final price: <span className="font-semibold text-foreground">
                    ₦{(parseFloat(salePrice) - (parseFloat(saleDiscount) || 0)).toLocaleString()}
                  </span>
                </p>
              )}
              <button
                onClick={convertToSale}
                disabled={converting}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                {converting ? "Creating sale…" : "Create Sale Record"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Status History</h2>
          </div>
          <ol className="relative border-l border-border ml-2 space-y-5">
            {timeline.map((entry) => {
              const newStatus = (entry.newValues as Record<string,unknown>)?.status as string | undefined;
              const oldStatus = (entry.oldValues as Record<string,unknown>)?.status as string | undefined;
              const note      = (entry.newValues as Record<string,unknown>)?.notes as string | undefined;
              return (
                <li key={entry.id} className="ml-5">
                  <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-card border-2 border-border" />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {entry.action === "CREATE" && "Reservation created"}
                      {entry.action === "STATUS_CHANGE" && newStatus && (
                        <>
                          Status changed
                          {oldStatus && <span className="text-muted-foreground"> from <span className="font-mono text-xs">{STATUS_CONFIG[oldStatus]?.label ?? oldStatus}</span></span>}
                          {" → "}
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CONFIG[newStatus]?.badgeClass ?? "bg-muted text-muted-foreground"}`}>
                            {STATUS_CONFIG[newStatus]?.label ?? newStatus}
                          </span>
                        </>
                      )}
                      {entry.action === "UPDATE" && "Details updated"}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  {entry.actorEmail && (
                    <p className="text-xs text-muted-foreground">by {entry.actorEmail}</p>
                  )}
                  {note && (
                    <p className="text-sm mt-1 bg-muted/40 rounded px-2.5 py-1.5 text-muted-foreground italic">{note}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Update Status</h2>
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground">
              Add a note (optional — sent to customer with status update)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for decision, next steps, contact time…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {transitions.map((t) => {
              const hasAccess = t.variant === "cancel" ? canCancelReservation : canUpdateReservation;
              return (
              <button
                key={t.status}
                onClick={() => hasAccess && updateStatus(t.status)}
                disabled={isPending || !hasAccess}
                title={!hasAccess ? NO_PERMISSION_MSG : undefined}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  t.variant === "confirm"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                } ${!hasAccess ? "cursor-not-allowed" : ""}`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : t.variant === "confirm" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
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
