"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, User, Building2, ShieldCheck,
  AlertCircle, XCircle, ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { usePermissions } from "@/components/layout/permissions-context";
import { can } from "@/lib/permissions";

const NO_PERMISSION_MSG = "This action is not under your permission list";

interface Inspector { id: string; firstName: string; lastName: string; jobTitle: string | null; email: string }
interface Property  { id: string; title: string; state: string; city: string | null; category: string }
interface Customer  { id: string; firstName: string | null; lastName: string | null; email: string; phone: string | null }

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: string;
  status: string;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  recommendation: string | null;
  overallScore: number | null;
  summary: string | null;
  notes: string | null;
  reportUrl: string | null;
  property: Property;
  inspector: Inspector;
  customer: Customer | null;
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  CANCELLED:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500",
  FAILED:      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const REC_COLORS: Record<string, string> = {
  APPROVE:                 "text-green-600 dark:text-green-400",
  APPROVE_WITH_CONDITIONS: "text-amber-600 dark:text-amber-400",
  REJECT:                  "text-red-600 dark:text-red-400",
  NEEDS_FOLLOW_UP:         "text-purple-600 dark:text-purple-400",
};

function fmtLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const RECOMMENDATIONS = [
  { value: "APPROVE",                 label: "Approve" },
  { value: "APPROVE_WITH_CONDITIONS", label: "Approve with conditions" },
  { value: "REJECT",                  label: "Reject" },
  { value: "NEEDS_FOLLOW_UP",         label: "Needs follow-up" },
];

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function InspectionDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const permissions = usePermissions();
  const canManageInspection = can(permissions, "inspection.update");
  const [insp,   setInsp]   = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState("");
  const [showComplete,  setShowComplete]  = useState(false);

  const [completeForm, setCompleteForm] = useState({
    recommendation: "APPROVE",
    overallScore:   "",
    summary:        "",
    notes:          "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/proxy/inspections/${id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to load inspection."); return; }
      setInsp(data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function callAction(path: string, body?: Record<string, unknown>) {
    setActionError("");
    setActionLoading(true);
    try {
      const res  = await fetch(`/api/proxy/inspections/${id}/${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.message ?? "Action failed."); return false; }
      return true;
    } catch {
      setActionError("Network error.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStart() {
    if (await callAction("start")) load();
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = { recommendation: completeForm.recommendation };
    if (completeForm.overallScore) body.overallScore = parseFloat(completeForm.overallScore);
    if (completeForm.summary)      body.summary = completeForm.summary;
    if (completeForm.notes)        body.notes   = completeForm.notes;
    if (await callAction("complete", body)) { setShowComplete(false); load(); }
  }

  async function handleCancel() {
    const reason = prompt("Reason for cancellation (optional):");
    if (reason === null) return; // user dismissed
    if (await callAction("cancel", { reason: reason ?? "" })) load();
  }

  async function handleFail() {
    const reason = prompt("Reason inspection failed:");
    if (!reason) return;
    if (await callAction("fail", { reason })) load();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Loading inspection…
      </div>
    );
  }

  if (error || !insp) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error || "Inspection not found."}</div>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/inspections">Back to inspections</Link>
        </Button>
      </div>
    );
  }

  const canStart    = insp.status === "SCHEDULED";
  const canComplete = insp.status === "IN_PROGRESS";
  const canCancel   = insp.status === "SCHEDULED" || insp.status === "IN_PROGRESS";
  const canFail     = insp.status === "IN_PROGRESS";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 h-16">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inspections"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-lg font-semibold">{insp.inspectionNumber}</h1>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[insp.status] ?? ""}`}>
            {fmtLabel(insp.status)}
          </span>
          <span className="text-sm text-muted-foreground">{fmtLabel(insp.type)} inspection</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl grid grid-cols-3 gap-6">

          {/* Left — metadata */}
          <div className="col-span-2 space-y-6">

            {/* Property */}
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Property
              </div>
              <div>
                <Link href={`/properties/${insp.property.id}`} className="font-medium hover:underline">
                  {insp.property.title}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {insp.property.city ? `${insp.property.city}, ` : ""}{insp.property.state}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{fmtLabel(insp.property.category)}</div>
              </div>
            </div>

            {/* Inspector & Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Inspector
                </div>
                <div className="text-sm font-medium">{insp.inspector.firstName} {insp.inspector.lastName}</div>
                {insp.inspector.jobTitle && <div className="text-xs text-muted-foreground">{insp.inspector.jobTitle}</div>}
                <div className="text-xs text-muted-foreground">{insp.inspector.email}</div>
              </div>

              {insp.customer ? (
                <div className="rounded-lg border bg-card p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Customer
                  </div>
                  <div className="text-sm font-medium">
                    <Link href={`/customers/${insp.customer.id}`} className="hover:underline">
                      {insp.customer.firstName} {insp.customer.lastName}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground">{insp.customer.email}</div>
                  {insp.customer.phone && <div className="text-xs text-muted-foreground">{insp.customer.phone}</div>}
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-5 flex items-center justify-center text-sm text-muted-foreground">
                  No customer linked
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Timeline
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span>{formatDateTime(insp.scheduledAt)}</span>
                </div>
                {insp.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span>{formatDateTime(insp.startedAt)}</span>
                  </div>
                )}
                {insp.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{formatDateTime(insp.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Outcome */}
            {insp.status === "COMPLETED" && (
              <div className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  Outcome
                </div>
                {insp.recommendation && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Recommendation:</span>
                    <span className={`font-semibold text-sm ${REC_COLORS[insp.recommendation] ?? ""}`}>
                      {fmtLabel(insp.recommendation)}
                    </span>
                  </div>
                )}
                {insp.overallScore != null && (
                  <div className="text-sm"><span className="text-muted-foreground">Score: </span>{insp.overallScore}/10</div>
                )}
                {insp.summary && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Summary</div>
                    <p className="text-sm">{insp.summary}</p>
                  </div>
                )}
                {insp.reportUrl && (
                  <a href={insp.reportUrl} target="_blank" rel="noopener noreferrer"
                     className="text-sm text-primary underline underline-offset-2">
                    View report
                  </a>
                )}
              </div>
            )}

            {/* Notes */}
            {insp.notes && (
              <div className="rounded-lg border bg-card p-5 space-y-2">
                <div className="text-sm font-semibold">Notes</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insp.notes}</p>
              </div>
            )}
          </div>

          {/* Right — actions */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="text-sm font-semibold">Actions</div>

              {actionError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{actionError}</div>
              )}

              {canStart && (
                <Button
                  className="w-full"
                  onClick={handleStart}
                  disabled={actionLoading || !canManageInspection}
                  title={!canManageInspection ? NO_PERMISSION_MSG : undefined}
                >
                  Start inspection
                </Button>
              )}

              {canComplete && !showComplete && (
                <Button
                  className="w-full"
                  onClick={() => canManageInspection && setShowComplete(true)}
                  disabled={actionLoading || !canManageInspection}
                  title={!canManageInspection ? NO_PERMISSION_MSG : undefined}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              )}

              {canFail && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                  onClick={handleFail}
                  disabled={actionLoading || !canManageInspection}
                  title={!canManageInspection ? NO_PERMISSION_MSG : undefined}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as failed
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={actionLoading || !canManageInspection}
                  title={!canManageInspection ? NO_PERMISSION_MSG : undefined}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}

              {!canStart && !canComplete && !canCancel && !canFail && (
                <p className="text-xs text-muted-foreground text-center py-2">No actions available.</p>
              )}
            </div>

            {/* Complete form */}
            {showComplete && (
              <div className="rounded-lg border bg-card p-5">
                <form onSubmit={handleComplete} className="space-y-4">
                  <div className="text-sm font-semibold">Complete inspection</div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Recommendation
                    </label>
                    <select
                      value={completeForm.recommendation}
                      onChange={(e) => setCompleteForm((p) => ({ ...p, recommendation: e.target.value }))}
                      className={selectCls}
                      required
                    >
                      {RECOMMENDATIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Overall score (0–10)
                    </label>
                    <input
                      type="number" min="0" max="10" step="0.1"
                      placeholder="e.g. 7.5"
                      value={completeForm.overallScore}
                      onChange={(e) => setCompleteForm((p) => ({ ...p, overallScore: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Summary
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief summary of findings…"
                      value={completeForm.summary}
                      onChange={(e) => setCompleteForm((p) => ({ ...p, summary: e.target.value }))}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={actionLoading} className="flex-1">
                      {actionLoading ? "Saving…" : "Save"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowComplete(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
