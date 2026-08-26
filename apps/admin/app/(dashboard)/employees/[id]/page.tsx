"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermissions } from "@/components/layout/permissions-context";
import { isSuperAdminOrExecutive } from "@/lib/permissions";
import {
  ChevronLeft, Loader2, CheckCircle, AlertCircle, XCircle,
  Mail, Phone, Calendar, Edit2, X, Save, Trash2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Department { id: string; name: string; code: string }
interface Role { id: string; name: string; code: string }
interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  status: string;
  hireDate: string;
  department: { id: string; name: string; code: string } | null;
  roles: { role: Role }[];
  user: { id: string; email: string; status: string; lastLoginAt: string | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:     "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  INACTIVE:   "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-500",
  ON_LEAVE:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const STATUS_ACTIVE_BTN: Record<string, string> = {
  ACTIVE:     "bg-green-600 text-white border-green-600",
  INACTIVE:   "bg-zinc-600 text-white border-zinc-600",
  ON_LEAVE:   "bg-yellow-500 text-white border-yellow-500",
  TERMINATED: "bg-red-600 text-white border-red-600",
};

const NO_PERMISSION_MSG = "This action is not under your permission list";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const permissions = usePermissions();
  const canManage = isSuperAdminOrExecutive(permissions);
  const [id, setId] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", jobTitle: "", departmentId: "",
  });

  const loadEmployee = async (resolvedId: string) => {
    try {
      const [empRes, rolesRes, deptsRes] = await Promise.all([
        fetch(`/api/proxy/employees/${resolvedId}`),
        fetch("/api/proxy/employees/roles"),
        fetch("/api/proxy/employees/departments"),
      ]);

      const emp: Employee | null = empRes.ok ? await empRes.json().then((d) => d?.id ? d : null) : null;
      const roles: Role[] = rolesRes.ok ? await rolesRes.json().then((d) => Array.isArray(d) ? d : []) : [];
      const depts: Department[] = deptsRes.ok ? await deptsRes.json().then((d) => Array.isArray(d) ? d : []) : [];

      setEmployee(emp);
      setAllRoles(roles);
      setDepartments(depts);
      if (emp) {
        setForm({
          firstName: emp.firstName ?? "",
          lastName: emp.lastName ?? "",
          phone: emp.phone ?? "",
          jobTitle: emp.jobTitle ?? "",
          departmentId: emp.department?.id ?? "",
        });
      }
    } catch {
      // leave as null — not-found state renders
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);
      loadEmployee(resolvedId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/proxy/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          phone: form.phone || undefined,
          jobTitle: form.jobTitle || undefined,
          departmentId: form.departmentId || undefined,
        }),
      });
      if (res.ok) {
        setEditing(false);
        setFeedback({ type: "success", msg: "Employee updated successfully." });
        await loadEmployee(id);
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

  function assignRole() {
    if (!selectedRoleId || !id) return;
    startTransition(async () => {
      const res = await fetch(`/api/proxy/employees/${id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });
      if (res.ok) {
        const role = allRoles.find((r) => r.id === selectedRoleId);
        if (role) setEmployee((prev) => prev ? { ...prev, roles: [...prev.roles, { role }] } : prev);
        setFeedback({ type: "success", msg: "Role assigned." });
        setSelectedRoleId("");
      } else {
        setFeedback({ type: "error", msg: "Failed to assign role." });
      }
    });
  }

  function removeRole(roleId: string) {
    startTransition(async () => {
      await fetch(`/api/proxy/employees/${id}/roles/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      setEmployee((prev) => prev ? { ...prev, roles: prev.roles.filter((r) => r.role.id !== roleId) } : prev);
    });
  }

  async function updateStatus(status: string) {
    if (!id) return;
    const res = await fetch(`/api/proxy/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setEmployee((prev) => prev ? { ...prev, status } : prev);
      setFeedback({ type: "success", msg: `Status updated to ${status.replace(/_/g, " ").toLowerCase()}.` });
    } else {
      setFeedback({ type: "error", msg: "Failed to update status." });
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/employees");
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
        <Header title="Employee" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Employee not found" />
        <div className="p-6">
          <p className="text-muted-foreground">This employee record does not exist.</p>
          <Link href="/employees" className="mt-3 inline-block text-sm text-secondary hover:underline">← Back to employees</Link>
        </div>
      </div>
    );
  }

  const assignedRoleIds = new Set(employee.roles.map((r) => r.role.id));
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.has(r.id));

  return (
    <div className="flex flex-col h-full">
      <Header title={`${employee.firstName} ${employee.lastName}`}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employees">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Employees
          </Link>
        </Button>
        {!editing ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditing(true); setFeedback(null); }}
              disabled={!canManage}
              title={!canManage ? NO_PERMISSION_MSG : undefined}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
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
                <h3 className="font-semibold">Delete employee?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              <strong>{employee.firstName} {employee.lastName}</strong>&apos;s record and login access will be permanently removed.
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
                {deleting ? "Deleting…" : "Delete employee"}
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

        {/* Header card */}
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[employee.status] ?? "bg-zinc-800 text-zinc-400")}>
                {employee.status?.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{employee.employeeNumber}</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">{employee.firstName} {employee.lastName}</h2>
            <p className="text-sm text-muted-foreground">{employee.jobTitle}{employee.department ? ` · ${employee.department.name}` : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Contact & Info */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Employee Information</h2>

            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-8 text-sm" placeholder="e.g. 080XXXXXXXX" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Job title</Label>
                  <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Department</Label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">No department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${employee.email}`} className="hover:text-foreground hover:underline transition-colors">
                    {employee.email}
                  </a>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <a href={`tel:${employee.phone}`} className="hover:text-foreground transition-colors">{employee.phone}</a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Hired {formatDate(employee.hireDate)}</span>
                </div>
                {employee.department && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department</span>
                    <span>{employee.department.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account status</span>
                  <span className={cn("text-xs font-medium", employee.user?.status === "ACTIVE" ? "text-green-500" : "text-muted-foreground")}>
                    {employee.user?.status ?? "No user account"}
                  </span>
                </div>
                {employee.user?.lastLoginAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last login</span>
                    <span>{formatDate(employee.user.lastLoginAt)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Employment status control */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Employment Status</h2>
            <div className="flex flex-wrap gap-2">
              {["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={employee.status === s || !canManage}
                  title={!canManage ? NO_PERMISSION_MSG : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors disabled:opacity-50 disabled:pointer-events-none",
                    employee.status === s
                      ? (STATUS_ACTIVE_BTN[s] ?? "bg-secondary text-secondary-foreground border-secondary cursor-default")
                      : "bg-background border-input hover:bg-muted text-foreground",
                  )}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click a status to update this employee&apos;s record.</p>
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Roles &amp; Permissions</h2>

          {employee.roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {employee.roles.map(({ role }) => (
                <div key={role.id} className="flex items-center gap-1.5 rounded-full bg-secondary/10 border border-secondary/20 pl-3 pr-1.5 py-1">
                  <span className="text-xs font-medium text-secondary">{role.name}</span>
                  {canManage && (
                    <button
                      onClick={() => removeRole(role.id)}
                      disabled={isPending}
                      className="rounded-full text-secondary/50 hover:text-destructive transition-colors"
                      title="Remove role"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {availableRoles.length > 0 && canManage && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Assign a role…</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button
                onClick={assignRole}
                disabled={!selectedRoleId || isPending}
                className="h-9 rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-60 transition-colors"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
