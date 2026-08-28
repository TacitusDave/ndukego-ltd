"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionPropertyStatus } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/components/layout/permissions-context";
import { can } from "@/lib/permissions";

const NO_PERMISSION_MSG = "This action is not under your permission list";

// Maps each target status to the permission required to transition to it
const STATUS_PERMISSION: Record<string, string> = {
  PENDING_INSPECTION:   "property.update",
  PENDING_VERIFICATION: "property.update",
  APPROVED:             "property.approve",
  PUBLISHED:            "property.publish",
  RESERVED:             "property.update",
  UNDER_NEGOTIATION:    "property.update",
  UNDER_CONTRACT:       "property.update",
  SOLD:                 "property.update",
  ARCHIVED:             "property.archive",
  REJECTED:             "property.update",
  DRAFT:                "property.update",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_INSPECTION", "REJECTED"],
  PENDING_INSPECTION: ["PENDING_VERIFICATION", "REJECTED"],
  PENDING_VERIFICATION: ["APPROVED", "REJECTED"],
  APPROVED: ["PUBLISHED", "REJECTED"],
  PUBLISHED: ["RESERVED", "UNDER_NEGOTIATION", "ARCHIVED"],
  RESERVED: ["UNDER_NEGOTIATION", "UNDER_CONTRACT", "PUBLISHED"],
  UNDER_NEGOTIATION: ["UNDER_CONTRACT", "PUBLISHED"],
  UNDER_CONTRACT: ["SOLD"],
  SOLD: ["ARCHIVED"],
  REJECTED: ["DRAFT"],
  ARCHIVED: [],
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_INSPECTION: "Pending inspection",
  PENDING_VERIFICATION: "Pending verification",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  RESERVED: "Reserved",
  UNDER_NEGOTIATION: "Under negotiation",
  UNDER_CONTRACT: "Under contract",
  SOLD: "Sold",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

const DESTRUCTIVE = new Set(["REJECTED", "ARCHIVED"]);

export function PropertyActions({ propertyId, currentStatus }: { propertyId: string; currentStatus: string }) {
  const router = useRouter();
  const permissions = usePermissions();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (allowed.length === 0) return null;

  function handleClick(status: string) {
    if (DESTRUCTIVE.has(status) || status === "SOLD") {
      setConfirmStatus(status);
      return;
    }
    doTransition(status);
  }

  function doTransition(status: string) {
    setError(null);
    startTransition(async () => {
      const result = await transitionPropertyStatus(propertyId, status, reason || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmStatus(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {confirmStatus ? (
        <div className="space-y-3 rounded-md border p-4 bg-muted/40">
          <p className="text-sm font-medium">
            Move to <strong>{STATUS_LABELS[confirmStatus]}</strong>?
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="reason" className="text-xs">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a note…"
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={DESTRUCTIVE.has(confirmStatus) ? "destructive" : "default"}
              disabled={pending}
              onClick={() => doTransition(confirmStatus)}
            >
              {pending ? "Saving…" : "Confirm"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setConfirmStatus(null); setReason(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allowed.map((status) => {
            const requiredPerm = STATUS_PERMISSION[status] ?? "property.update";
            const hasAccess = can(permissions, requiredPerm);
            return (
              <Button
                key={status}
                size="sm"
                variant={DESTRUCTIVE.has(status) ? "destructive" : "outline"}
                disabled={pending || !hasAccess}
                title={!hasAccess ? NO_PERMISSION_MSG : undefined}
                className={!hasAccess ? "opacity-50 cursor-not-allowed" : ""}
                onClick={() => hasAccess && handleClick(status)}
              >
                {STATUS_LABELS[status]}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
