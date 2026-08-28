"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/components/layout/permissions-context";
import { can } from "@/lib/permissions";

const NO_PERMISSION_MSG = "This action is not under your permission list";

export function ScheduleInspectionButton() {
  const permissions = usePermissions();
  const allowed = can(permissions, "inspection.create");

  if (!allowed) {
    return (
      <Button size="sm" disabled title={NO_PERMISSION_MSG} className="opacity-50 cursor-not-allowed">
        <Plus className="mr-1 h-4 w-4" />
        Schedule inspection
      </Button>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/inspections/new">
        <Plus className="mr-1 h-4 w-4" />
        Schedule inspection
      </Link>
    </Button>
  );
}
