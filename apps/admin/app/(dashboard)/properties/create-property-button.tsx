"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/components/layout/permissions-context";
import { can } from "@/lib/permissions";

const NO_PERMISSION_MSG = "This action is not under your permission list";

export function CreatePropertyButton() {
  const permissions = usePermissions();
  const allowed = can(permissions, "property.create");

  if (!allowed) {
    return (
      <Button size="sm" disabled title={NO_PERMISSION_MSG} className="opacity-50 cursor-not-allowed">
        <Plus className="mr-1 h-4 w-4" />
        Add property
      </Button>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/properties/new">
        <Plus className="mr-1 h-4 w-4" />
        Add property
      </Link>
    </Button>
  );
}
