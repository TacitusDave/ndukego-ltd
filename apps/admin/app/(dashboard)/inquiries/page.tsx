"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageSquare, Search, Building2, ChevronDown, ChevronUp, StickyNote, Save, ArrowRight, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Inquiry {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  message: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  status: string;
  staffNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse {
  items: Inquiry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; next: string[] }> = {
  NEW:       { label: "New",       badge: "bg-blue-100 text-blue-700",    next: ["CONTACTED", "CLOSED"] },
  CONTACTED: { label: "Contacted", badge: "bg-yellow-100 text-yellow-700", next: ["CONVERTED", "CLOSED"] },
  CONVERTED: { label: "Converted", badge: "bg-green-100 text-green-700",   next: ["CLOSED"] },
  CLOSED:    { label: "Closed",    badge: "bg-zinc-100 text-zinc-500",     next: ["NEW"] },
};

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONVERTED", label: "Converted" },
  { value: "CLOSED", label: "Closed" },
];

export default function InquiriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page   = searchParams.get("page")   ?? "1";

  const [data,     setData]     = useState<PageResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-inquiry notes state: { [id]: draftText }
  const [notes,       setNotes]       = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);

  // Conversion state
  const [converting,   setConverting]   = useState<string | null>(null);
  const [convertResult, setConvertResult] = useState<Record<string, { reservationId: string; reservationNumber: string }>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: "20" });
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    try {
      const res = await fetch(`/api/proxy/properties/admin/inquiries?${q}`);
      if (res.ok) {
        const json: PageResponse = await res.json();
        setData(json);
        // Seed notes drafts from server values
        const seeded: Record<string, string> = {};
        json.items.forEach((i) => { seeded[i.id] = i.staffNotes ?? ""; });
        setNotes((prev) => ({ ...seeded, ...prev }));
      }
    } catch { /* pass */ }
    finally { setLoading(false); }
  }, [page, status, search]);

  // Deferred so the initial fetch's setState never runs synchronously in the effect.
  useEffect(() => { void Promise.resolve().then(() => fetchData()); }, [fetchData]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/proxy/properties/admin/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) => prev ? {
          ...prev,
          items: prev.items.map((i) => i.id === id ? { ...i, status: newStatus } : i),
        } : prev);
      }
    } finally { setUpdating(null); }
  }

  async function saveNotes(id: string) {
    setSavingNotes(id);
    try {
      const res = await fetch(`/api/proxy/properties/admin/inquiries/${id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffNotes: notes[id] ?? "" }),
      });
      if (res.ok) {
        setData((prev) => prev ? {
          ...prev,
          items: prev.items.map((i) => i.id === id ? { ...i, staffNotes: notes[id] ?? "" } : i),
        } : prev);
      }
    } finally { setSavingNotes(null); }
  }

  async function convertInquiry(id: string) {
    setConverting(id);
    try {
      const res = await fetch(`/api/proxy/properties/admin/inquiries/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const result = await res.json();
        setConvertResult((prev) => ({ ...prev, [id]: result }));
        setData((prev) => prev ? {
          ...prev,
          items: prev.items.map((i) => i.id === id ? { ...i, status: "CONVERTED" } : i),
        } : prev);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Conversion failed. Please try again.");
      }
    } finally { setConverting(null); }
  }

  function navigate(params: Record<string, string>) {
    const q = new URLSearchParams({ search, status, page, ...params });
    if (!q.get("search")) q.delete("search");
    if (!q.get("status")) q.delete("status");
    if (q.get("page") === "1") q.delete("page");
    router.push(`/inquiries?${q.toString()}`);
  }

  const items = data?.items ?? [];
  const meta  = data?.meta;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Inquiries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta ? `${meta.total} inquiry${meta.total === 1 ? "" : "s"}` : "Leads from the public website"}
          </p>
        </div>
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate({ search: (fd.get("search") as string) ?? "", status: (fd.get("status") as string) ?? "", page: "1" });
        }}
        className="flex flex-wrap gap-2"
      >
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, property…"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filter
        </button>
        {(search || status) && (
          <button
            type="button"
            onClick={() => navigate({ search: "", status: "", page: "1" })}
            className="h-9 flex items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="h-6 w-6 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No inquiries found</p>
            {(search || status) && (
              <button
                onClick={() => navigate({ search: "", status: "", page: "1" })}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Contact</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Property</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Message</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Received</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((inquiry) => {
                  const name         = [inquiry.firstName, inquiry.lastName].filter(Boolean).join(" ") || "—";
                  const cfg          = STATUS_CONFIG[inquiry.status] ?? { label: inquiry.status, badge: "bg-zinc-100 text-zinc-500", next: [] };
                  const isUpdating   = updating === inquiry.id;
                  const isOpen       = expanded === inquiry.id;
                  const hasSavedNote = !!inquiry.staffNotes;
                  const noteDraft    = notes[inquiry.id] ?? inquiry.staffNotes ?? "";
                  const isDirty      = noteDraft !== (inquiry.staffNotes ?? "");
                  const isConverting = converting === inquiry.id;
                  const converted    = convertResult[inquiry.id];
                  const canConvert   = !!inquiry.propertyId && (inquiry.status === "NEW" || inquiry.status === "CONTACTED");

                  return (
                    <>
                      <tr key={inquiry.id} className={`hover:bg-muted/20 transition-colors ${isOpen ? "bg-muted/10" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          {inquiry.propertyTitle ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[180px]">{inquiry.propertyTitle}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">General inquiry</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-muted-foreground max-w-xs truncate">
                            {inquiry.message ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(inquiry.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* Notes toggle */}
                            <button
                              onClick={() => setExpanded(isOpen ? null : inquiry.id)}
                              title={hasSavedNote ? "View/edit notes" : "Add notes"}
                              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${hasSavedNote ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/40" : "hover:bg-muted"}`}
                            >
                              <StickyNote className="h-3 w-3" />
                              {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>

                            {/* Convert to reservation */}
                            {converted ? (
                              <a
                                href={`/reservations/${converted.reservationId}`}
                                className="flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {converted.reservationNumber}
                              </a>
                            ) : canConvert && (
                              <button
                                onClick={() => convertInquiry(inquiry.id)}
                                disabled={isConverting}
                                title="Convert to reservation"
                                className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                              >
                                {isConverting ? "Converting…" : (
                                  <><ArrowRight className="h-3 w-3" /> Reserve</>
                                )}
                              </button>
                            )}

                            {/* Status dropdown */}
                            {cfg.next.length > 0 && (
                              <div className="relative group inline-block">
                                <button
                                  disabled={isUpdating}
                                  className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? "Updating…" : "Update"}
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block bg-card border rounded-md shadow-lg min-w-[130px] py-1">
                                  {cfg.next.map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => updateStatus(inquiry.id, s)}
                                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                    >
                                      Mark as {STATUS_CONFIG[s]?.label ?? s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable notes row */}
                      {isOpen && (
                        <tr key={`${inquiry.id}-notes`} className="bg-muted/5 border-b">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="max-w-2xl space-y-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <StickyNote className="h-3.5 w-3.5" />
                                Full message
                              </div>
                              {inquiry.message ? (
                                <p className="text-sm bg-muted/40 rounded-md px-3 py-2 whitespace-pre-wrap">{inquiry.message}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No message provided.</p>
                              )}

                              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                                <StickyNote className="h-3.5 w-3.5" />
                                Staff notes
                              </div>
                              <textarea
                                rows={3}
                                placeholder="Log call outcomes, follow-up actions, or any notes about this inquiry…"
                                value={noteDraft}
                                onChange={(e) => setNotes((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                              />
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => saveNotes(inquiry.id)}
                                  disabled={savingNotes === inquiry.id || !isDirty}
                                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                  <Save className="h-3 w-3" />
                                  {savingNotes === inquiry.id ? "Saving…" : "Save notes"}
                                </button>
                                {!isDirty && inquiry.staffNotes && (
                                  <span className="text-xs text-muted-foreground">
                                    Last updated {formatDate(inquiry.updatedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {meta.page > 1 && (
            <button
              onClick={() => navigate({ page: String(meta.page - 1) })}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Previous
            </button>
          )}
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          {meta.page < meta.totalPages && (
            <button
              onClick={() => navigate({ page: String(meta.page + 1) })}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
