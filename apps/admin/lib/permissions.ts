export type Permission = string;

// ─── Core check ───────────────────────────────────────────────────────────────
export function hasPermission(permissions: Permission[], code: string): boolean {
  return permissions.includes(code);
}

// ─── Sidebar section visibility ───────────────────────────────────────────────
const SECTION_PERMISSIONS: Record<string, string> = {
  dashboard:   "dashboard.read",
  properties:  "property.read",
  estates:     "estate.read",
  reservations:"reservation.read",
  sales:       "sale.read",
  customers:   "customer.read",
  inquiries:   "customer.read",
  inspections: "inspection.read",
  documents:   "document.read",
  employees:   "employee.read",
  reports:     "dashboard.read",
  settings:    "settings.manage",
};

export function canSeeSection(permissions: Permission[], section: string): boolean {
  const required = SECTION_PERMISSIONS[section];
  if (!required) return true;
  return permissions.includes(required);
}

// ─── Role-level checks ────────────────────────────────────────────────────────
// property.delete is seeded only for SUPER_ADMIN and EXECUTIVE — reliable proxy
export function isSuperAdminOrExecutive(permissions: Permission[]): boolean {
  return permissions.includes("property.delete");
}

// Settings page access — SUPER_ADMIN only
export function isSuperAdmin(permissions: Permission[]): boolean {
  return permissions.includes("settings.manage");
}
