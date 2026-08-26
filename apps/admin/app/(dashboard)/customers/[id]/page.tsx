"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/components/layout/permissions-context";
import { isSuperAdminOrExecutive } from "@/lib/permissions";
import Link from "next/link";
import {
  ChevronLeft, Mail, Phone, MapPin, User, CalendarCheck,
  CheckCircle, AlertCircle, Loader2, Edit2, X, Save, Trash2, ShieldOff, ShieldCheck,
  Receipt,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  customerNumber: string;
  type: string;
  status: string;
  kycStatus: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  companyName: string | null;
  email: string;
  phone: string;
  whatsapp: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  occupation: string | null;
  nationality: string;
  leadSource: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  reservations: {
    id: string;
    reservationNumber: string;
    status: string;
    reservationAmount: string;
    reservedAt: string;
    confirmedAt: string | null;
    cancelledAt: string | null;
    property: { id: string; title: string; state: string; city: string | null };
  }[];
  sales: {
    id: string;
    saleNumber: string;
    status: string;
    type: string;
    finalPrice: string;
    totalPaid: string;
    balanceDue: string;
    createdAt: string;
    property: { id: string; title: string; state: string; city: string | null };
  }[];
}

const STATUS_BADGE: Record<string, string> = {
  PROSPECT:   "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400",
  ACTIVE:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  INACTIVE:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500",
  BLACKLISTED:"bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const KYC_BADGE: Record<string, string> = {
  NOT_STARTED:"bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-500",
  PENDING:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  VERIFIED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  REJECTED:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  EXPIRED:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

const RESERVATION_BADGE: Record<string, string> = {
  PENDING:           "bg-yellow-100 text-yellow-700",
  CONFIRMED:         "bg-green-100 text-green-700",
  EXPIRED:           "bg-zinc-100 text-zinc-500",
  CANCELLED:         "bg-red-100 text-red-700",
  CONVERTED_TO_SALE: "bg-blue-100 text-blue-700",
};

const SALE_BADGE: Record<string, string> = {
  DRAFT:            "bg-zinc-100 text-zinc-600",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED:         "bg-blue-100 text-blue-700",
  ACTIVE:           "bg-green-100 text-green-700",
  DISPUTED:         "bg-orange-100 text-orange-700",
  COMPLETED:        "bg-emerald-100 text-emerald-700",
  CANCELLED:        "bg-red-100 text-red-700",
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

function displayName(c: Customer) {
  if (c.firstName || c.lastName)
    return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ");
  return c.companyName ?? c.email;
}

const NO_PERMISSION_MSG = "This action is not under your permission list";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const permissions = usePermissions();
  const canManage = isSuperAdminOrExecutive(permissions);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", middleName: "", companyName: "",
    phone: "", whatsapp: "", alternatePhone: "", email: "",
    address: "", city: "", state: "", occupation: "",
    status: "", kycStatus: "", notes: "",
  });

  const loadCustomer = async () => {
    try {
      const r = await fetch(`/api/proxy/customers/${id}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const c: Customer = await r.json();
      if (!c?.id) return;
      setCustomer(c);
      setForm({
        firstName: c.firstName ?? "",
        lastName: c.lastName ?? "",
        middleName: c.middleName ?? "",
        companyName: c.companyName ?? "",
        phone: c.phone ?? "",
        whatsapp: c.whatsapp ?? "",
        alternatePhone: c.alternatePhone ?? "",
        email: c.email ?? "",
        address: c.address ?? "",
        city: c.city ?? "",
        state: c.state ?? "",
        occupation: c.occupation ?? "",
        status: c.status,
        kycStatus: c.kycStatus,
        notes: c.notes ?? "",
      });
    } catch {
      // leave customer null — "not found" state renders
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/proxy/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          middleName: form.middleName || undefined,
          companyName: form.companyName || undefined,
          phone: form.phone,
          whatsapp: form.whatsapp || undefined,
          alternatePhone: form.alternatePhone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          occupation: form.occupation || undefined,
          status: form.status,
          kycStatus: form.kycStatus,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setEditing(false);
        setFeedback({ type: "success", msg: "Customer updated successfully." });
        await loadCustomer();
      } else {
        const body = await res.json().catch(() => ({}));
        setFeedback({ type: "error", msg: body.message ?? "Update failed." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Cannot reach server." });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!customer) return;
    const isActive = customer.status === "ACTIVE" || customer.status === "PROSPECT";
    const endpoint = isActive ? "deactivate" : "activate";
    setToggling(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/proxy/customers/${id}/${endpoint}`, { method: "POST" });
      if (res.ok) {
        setFeedback({ type: "success", msg: isActive ? "Customer deactivated." : "Customer activated." });
        await loadCustomer();
      } else {
        const body = await res.json().catch(() => ({}));
        setFeedback({ type: "error", msg: body.message ?? "Action failed." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Cannot reach server." });
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/customers");
      } else {
        const body = await res.json().catch(() => ({}));
        setFeedback({ type: "error", msg: body.message ?? "Delete failed." });
        setConfirmDelete(false);
      }
    } catch {
      setFeedback({ type: "error", msg: "Cannot reach server." });
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Customer" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Customer not found" />
        <div className="p-6">
          <p className="text-muted-foreground">This customer does not exist.</p>
          <Link href="/customers" className="mt-3 inline-block text-sm text-secondary hover:underline">← Back to customers</Link>
        </div>
      </div>
    );
  }

  const name = displayName(customer);

  return (
    <div className="flex flex-col h-full">
      <Header title={name}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Customers
          </Link>
        </Button>
        {!editing ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={!canManage}
              title={!canManage ? NO_PERMISSION_MSG : undefined}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleStatus}
              disabled={toggling || !canManage}
              title={!canManage ? NO_PERMISSION_MSG : undefined}
              className={
                customer.status === "INACTIVE"
                  ? "border-green-600/30 text-green-600 hover:bg-green-600 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
                  : "border-amber-500/30 text-amber-600 hover:bg-amber-500 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
              }
            >
              {toggling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : customer.status === "INACTIVE" ? (
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
              )}
              {customer.status === "INACTIVE" ? "Activate" : "Deactivate"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              disabled={!canManage}
              title={!canManage ? NO_PERMISSION_MSG : undefined}
              className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setFeedback(null); }}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </Header>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Delete customer?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              <strong>{name}</strong>&apos;s record and any associated login access will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                {deleting ? "Deleting…" : "Delete customer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-5 max-w-4xl">

        {/* Feedback */}
        {feedback && (
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-green-700/30 bg-green-900/20 text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}>
            {feedback.type === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {feedback.msg}
          </div>
        )}

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
          <span className="font-mono text-xs text-muted-foreground">{customer.customerNumber}</span>
          <span className="text-muted-foreground">·</span>
          {editing ? (
            <>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Status:</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {["PROSPECT","ACTIVE","INACTIVE","BLACKLISTED"].map((s) => (
                    <option key={s} value={s}>{s.toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">KYC:</Label>
                <select
                  value={form.kycStatus}
                  onChange={(e) => setForm({ ...form, kycStatus: e.target.value })}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {["NOT_STARTED","PENDING","VERIFIED","REJECTED","EXPIRED"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[customer.status])}>
                {customer.status?.toLowerCase() ?? customer.status}
              </span>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", KYC_BADGE[customer.kycStatus])}>
                KYC: {customer.kycStatus?.replace(/_/g, " ")?.toLowerCase() ?? customer.kycStatus}
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground ml-auto capitalize">
            {customer.type?.toLowerCase() ?? ""}{customer.nationality ? ` · ${customer.nationality}` : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Contact information */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" /> Contact information
            </h2>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">First name</Label>
                    <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last name</Label>
                    <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="If different from phone" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alternate phone</Label>
                  <Input value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Occupation</Label>
                  <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
            ) : (
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-foreground hover:underline transition-colors">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:text-foreground transition-colors">{customer.phone}</a>
                </div>
                {customer.whatsapp && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>WhatsApp: {customer.whatsapp}</span>
                  </div>
                )}
                {customer.alternatePhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>Alt: {customer.alternatePhone}</span>
                  </div>
                )}
                {(customer.address || customer.city || customer.state) && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {customer.occupation && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Occupation</dt>
                    <dd>{customer.occupation}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Profile */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-secondary" /> Account profile
            </h2>
            <dl className="space-y-2.5 text-sm">
              {customer.leadSource && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Lead source</dt>
                  <dd className="capitalize">{customer.leadSource.toLowerCase()}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Reservations</dt>
                <dd className="tabular-nums font-medium">{customer.reservations.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sales</dt>
                <dd className="tabular-nums font-medium">{customer.sales.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Registered</dt>
                <dd>{formatDate(customer.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>{formatDate(customer.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Internal notes</h2>
          {editing ? (
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Add any internal notes about this customer…"
              className="text-sm resize-none"
            />
          ) : customer.notes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No notes yet.</p>
          )}
        </div>

        {/* Reservation history */}
        {customer.reservations.length > 0 && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                Reservations
              </h2>
              <span className="text-xs text-muted-foreground">{customer.reservations.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Ref</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Property</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Fee</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Status</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Date</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customer.reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-muted-foreground">{r.reservationNumber}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-xs truncate max-w-[160px]">{r.property.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.property.city ? `${r.property.city}, ` : ""}{r.property.state}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {Number(r.reservationAmount) > 0 ? formatCurrency(r.reservationAmount) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", RESERVATION_BADGE[r.status] ?? "bg-muted text-muted-foreground")}>
                          {r.status.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(r.reservedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/reservations/${r.id}`} className="text-xs text-primary hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sales history */}
        {customer.sales.length > 0 && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Sales
              </h2>
              <span className="text-xs text-muted-foreground">{customer.sales.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Sale #</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Property</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Final Price</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Balance</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Status</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Date</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customer.sales.map((s) => {
                    const balance = Number(s.balanceDue);
                    return (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs text-muted-foreground">{s.saleNumber}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-xs truncate max-w-[160px]">{s.property.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{s.type.toLowerCase()}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium">{formatCurrency(s.finalPrice)}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className={balance > 0 ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
                            {balance > 0 ? formatCurrency(s.balanceDue) : "Paid"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", SALE_BADGE[s.status] ?? "bg-muted text-muted-foreground")}>
                            {s.status.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(s.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Link href={`/sales/${s.id}`} className="text-xs text-primary hover:underline">
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
