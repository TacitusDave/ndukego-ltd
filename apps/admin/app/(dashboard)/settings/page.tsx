"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, CheckCircle, AlertCircle, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "company" | "branches" | "departments";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe",
  "Zamfara","FCT — Abuja",
];

interface Company {
  id: string; name: string; legalName: string; registrationNumber: string | null;
  taxId: string | null; email: string; phone: string | null; website: string | null;
  address: string | null; city: string | null; state: string | null;
  postalCode: string | null; country: string; description: string | null;
  missionStatement: string | null; visionStatement: string | null;
  status: string; branches: Branch[];
}

interface Branch {
  id: string; name: string; code: string; address: string | null;
  city: string | null; state: string | null; phone: string | null;
  email: string | null; isHeadOffice: boolean;
}

interface Department {
  id: string; name: string; code: string; description: string | null;
  head: { id: string; firstName: string; lastName: string; jobTitle: string | null } | null;
  _count: { employees: number };
}

const emptyBranchForm = { name:"",code:"",address:"",city:"",state:"",phone:"",email:"",isHeadOffice:false };

export default function SettingsPage() {
  const [tab,     setTab]     = useState<Tab>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [depts,   setDepts]   = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; message: string } | null>(null);

  const [form, setForm] = useState({
    name:"",legalName:"",registrationNumber:"",taxId:"",email:"",phone:"",
    website:"",address:"",city:"",state:"",postalCode:"",description:"",
    missionStatement:"",visionStatement:"",
  });

  // Branch state
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [addingBranch, setAddingBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editBranchForm, setEditBranchForm] = useState(emptyBranchForm);
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null);

  // Department state
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptForm, setDeptForm] = useState({ name:"",code:"",description:"" });
  const [addingDept, setAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptForm, setEditDeptForm] = useState({ name:"",description:"" });
  const [deletingDept, setDeletingDept] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, deptRes] = await Promise.all([
        fetch("/api/proxy/companies?limit=1"),
        fetch("/api/proxy/companies/departments"),
      ]);
      if (compRes.ok) {
        const data = await compRes.json();
        const c: Company = data.items?.[0];
        if (c) {
          setCompany(c);
          setForm({
            name: c.name ?? "", legalName: c.legalName ?? "",
            registrationNumber: c.registrationNumber ?? "", taxId: c.taxId ?? "",
            email: c.email ?? "", phone: c.phone ?? "", website: c.website ?? "",
            address: c.address ?? "", city: c.city ?? "", state: c.state ?? "",
            postalCode: c.postalCode ?? "", description: c.description ?? "",
            missionStatement: c.missionStatement ?? "", visionStatement: c.visionStatement ?? "",
          });
        }
      }
      if (deptRes.ok) setDepts(await deptRes.json());
    } catch { /* pass */ }
    finally { setLoading(false); }
  }, []);

  // Deferred so the initial load's setState never runs synchronously in the effect.
  useEffect(() => { void Promise.resolve().then(() => loadData()); }, [loadData]);

  function flash(type: "success"|"error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ─── Company save ─────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, legalName: form.legalName,
          registrationNumber: form.registrationNumber || null, taxId: form.taxId || null,
          email: form.email, phone: form.phone || null, website: form.website || null,
          address: form.address || null, city: form.city || null, state: form.state || null,
          postalCode: form.postalCode || null, description: form.description || null,
          missionStatement: form.missionStatement || null, visionStatement: form.visionStatement || null,
        }),
      });
      if (!res.ok) throw new Error();
      flash("success", "Company settings saved.");
    } catch { flash("error", "Failed to save changes."); }
    finally { setSaving(false); }
  }

  // ─── Branch actions ───────────────────────────────────────────
  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setAddingBranch(true);
    try {
      const res = await fetch(`/api/proxy/companies/${company.id}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...branchForm, code: branchForm.code.toUpperCase() }),
      });
      if (!res.ok) throw new Error();
      const newBranch: Branch = await res.json();
      setCompany((prev) => prev ? { ...prev, branches: [...prev.branches, newBranch] } : prev);
      setBranchForm(emptyBranchForm);
      setShowBranchForm(false);
      flash("success", "Branch added.");
    } catch { flash("error", "Failed to add branch."); }
    finally { setAddingBranch(false); }
  }

  async function handleUpdateBranch(branchId: string) {
    try {
      const res = await fetch(`/api/proxy/companies/branches/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editBranchForm, code: editBranchForm.code.toUpperCase() }),
      });
      if (!res.ok) throw new Error();
      const updated: Branch = await res.json();
      setCompany((prev) => prev ? {
        ...prev, branches: prev.branches.map((b) => b.id === branchId ? updated : b),
      } : prev);
      setEditingBranch(null);
      flash("success", "Branch updated.");
    } catch { flash("error", "Failed to update branch."); }
  }

  async function handleDeleteBranch(branchId: string) {
    setDeletingBranch(branchId);
    try {
      const res = await fetch(`/api/proxy/companies/branches/${branchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCompany((prev) => prev ? {
        ...prev, branches: prev.branches.filter((b) => b.id !== branchId),
      } : prev);
      flash("success", "Branch removed.");
    } catch { flash("error", "Failed to remove branch."); }
    finally { setDeletingBranch(null); }
  }

  // ─── Department actions ───────────────────────────────────────
  async function handleAddDept(e: React.FormEvent) {
    e.preventDefault();
    setAddingDept(true);
    try {
      const res = await fetch("/api/proxy/companies/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deptForm, code: deptForm.code.toUpperCase() }),
      });
      if (!res.ok) throw new Error();
      const newDept: Department = await res.json();
      setDepts((prev) => [...prev, newDept].sort((a,b) => a.name.localeCompare(b.name)));
      setDeptForm({ name:"",code:"",description:"" });
      setShowDeptForm(false);
      flash("success", "Department created.");
    } catch { flash("error", "Failed to create department."); }
    finally { setAddingDept(false); }
  }

  async function handleUpdateDept(id: string) {
    try {
      const res = await fetch(`/api/proxy/companies/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDeptForm),
      });
      if (!res.ok) throw new Error();
      const updated: Department = await res.json();
      setDepts((prev) => prev.map((d) => d.id === id ? updated : d));
      setEditingDept(null);
      flash("success", "Department updated.");
    } catch { flash("error", "Failed to update department."); }
  }

  async function handleDeleteDept(id: string) {
    setDeletingDept(id);
    try {
      const res = await fetch(`/api/proxy/companies/departments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDepts((prev) => prev.filter((d) => d.id !== id));
      flash("success", "Department removed.");
    } catch { flash("error", "Failed to remove department."); }
    finally { setDeletingDept(null); }
  }

  const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Settings" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-auto p-6 max-w-4xl">

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-border mb-6">
          {(["company","branches","departments"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize",
                tab === t
                  ? "border-secondary text-secondary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
          <Link
            href="/settings/password"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors -mb-px"
          >
            Password
          </Link>
        </div>

        {feedback && (
          <div className={cn(
            "mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-green-700/30 bg-green-900/20 text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}>
            {feedback.type === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {feedback.message}
          </div>
        )}

        {/* ── Company tab ───────────────────────────────────────── */}
        {tab === "company" && (
          <form onSubmit={handleSave}>
            <div className="rounded-xl border bg-card mb-6">
              <div className="flex items-center gap-3 px-6 py-4 border-b">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-semibold">Company Information</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name <span className="text-destructive">*</span></Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="legalName">Legal Name <span className="text-destructive">*</span></Label>
                    <Input id="legalName" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="registrationNumber">RC Number (CAC)</Label>
                    <Input id="registrationNumber" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="RC 000000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="taxId">TIN</Label>
                    <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="00000000-0001" />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Company Email <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Address</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="address">Street Address</Label>
                      <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>State</Label>
                        <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={selectCls}>
                          <option value="">Select state</option>
                          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">About</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="missionStatement">Mission Statement</Label>
                      <Textarea id="missionStatement" rows={2} value={form.missionStatement} onChange={(e) => setForm({ ...form, missionStatement: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="visionStatement">Vision Statement</Label>
                      <Textarea id="visionStatement" rows={2} value={form.visionStatement} onChange={(e) => setForm({ ...form, visionStatement: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* ── Branches tab ──────────────────────────────────────── */}
        {tab === "branches" && (
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold">Office Branches</h2>
              <Button variant="outline" size="sm" onClick={() => { setShowBranchForm(!showBranchForm); setEditingBranch(null); }}>
                <Plus className="mr-1.5 h-4 w-4" />Add branch
              </Button>
            </div>

            {showBranchForm && (
              <form onSubmit={handleAddBranch} className="px-6 py-5 border-b bg-muted/30">
                <p className="text-sm font-semibold mb-4">New Branch</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Branch Name <span className="text-destructive">*</span></Label>
                    <Input required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Head Office" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Code <span className="text-destructive">*</span></Label>
                    <Input required value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} placeholder="HQ" maxLength={10} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Address</Label>
                    <Input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <select value={branchForm.state} onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })} className={selectCls}>
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="isHQ" checked={branchForm.isHeadOffice} onChange={(e) => setBranchForm({ ...branchForm, isHeadOffice: e.target.checked })} className="h-4 w-4 rounded border-input" />
                    <Label htmlFor="isHQ">This is the head office</Label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" size="sm" disabled={addingBranch}>
                    {addingBranch ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Adding…</> : "Add branch"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowBranchForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {company?.branches && company.branches.length > 0 ? (
              <div className="divide-y">
                {company.branches.map((branch) => (
                  <div key={branch.id} className="px-6 py-4">
                    {editingBranch === branch.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Branch Name</Label>
                            <Input value={editBranchForm.name} onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Code</Label>
                            <Input value={editBranchForm.code} onChange={(e) => setEditBranchForm({ ...editBranchForm, code: e.target.value })} maxLength={10} />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>Address</Label>
                            <Input value={editBranchForm.address} onChange={(e) => setEditBranchForm({ ...editBranchForm, address: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>City</Label>
                            <Input value={editBranchForm.city} onChange={(e) => setEditBranchForm({ ...editBranchForm, city: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>State</Label>
                            <select value={editBranchForm.state} onChange={(e) => setEditBranchForm({ ...editBranchForm, state: e.target.value })} className={selectCls}>
                              <option value="">Select state</option>
                              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Phone</Label>
                            <Input value={editBranchForm.phone} onChange={(e) => setEditBranchForm({ ...editBranchForm, phone: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input type="email" value={editBranchForm.email} onChange={(e) => setEditBranchForm({ ...editBranchForm, email: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateBranch(branch.id)}>
                            <Check className="mr-1.5 h-3.5 w-3.5" />Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingBranch(null)}>
                            <X className="mr-1.5 h-3.5 w-3.5" />Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{branch.name}</p>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{branch.code}</span>
                            {branch.isHeadOffice && <Badge variant="outline" className="text-xs">Head Office</Badge>}
                          </div>
                          {(branch.address || branch.city || branch.state) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[branch.address, branch.city, branch.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {(branch.phone || branch.email) && (
                            <p className="text-xs text-muted-foreground">
                              {[branch.phone, branch.email].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingBranch(branch.id);
                            setEditBranchForm({
                              name: branch.name, code: branch.code,
                              address: branch.address ?? "", city: branch.city ?? "",
                              state: branch.state ?? "", phone: branch.phone ?? "",
                              email: branch.email ?? "", isHeadOffice: branch.isHeadOffice,
                            });
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingBranch === branch.id}
                            onClick={() => {
                              if (confirm(`Remove branch "${branch.name}"?`)) handleDeleteBranch(branch.id);
                            }}
                          >
                            {deletingBranch === branch.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No branches added yet.
              </div>
            )}
          </div>
        )}

        {/* ── Departments tab ───────────────────────────────────── */}
        {tab === "departments" && (
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold">Departments</h2>
              <Button variant="outline" size="sm" onClick={() => { setShowDeptForm(!showDeptForm); setEditingDept(null); }}>
                <Plus className="mr-1.5 h-4 w-4" />Add department
              </Button>
            </div>

            {showDeptForm && (
              <form onSubmit={handleAddDept} className="px-6 py-5 border-b bg-muted/30">
                <p className="text-sm font-semibold mb-4">New Department</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Department Name <span className="text-destructive">*</span></Label>
                    <Input required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Sales & Marketing" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Code <span className="text-destructive">*</span></Label>
                    <Input required value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="SALES" maxLength={20} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea rows={2} value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="What this department does…" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" size="sm" disabled={addingDept}>
                    {addingDept ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Creating…</> : "Create department"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowDeptForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {depts.length > 0 ? (
              <div className="divide-y">
                {depts.map((dept) => (
                  <div key={dept.id} className="px-6 py-4">
                    {editingDept === dept.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>Department Name</Label>
                            <Input value={editDeptForm.name} onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })} />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>Description</Label>
                            <Textarea rows={2} value={editDeptForm.description} onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateDept(dept.id)}>
                            <Check className="mr-1.5 h-3.5 w-3.5" />Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDept(null)}>
                            <X className="mr-1.5 h-3.5 w-3.5" />Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{dept.name}</p>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{dept.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {dept._count.employees} employee{dept._count.employees !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {dept.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{dept.description}</p>
                          )}
                          {dept.head && (
                            <p className="text-xs text-muted-foreground">
                              Head: {dept.head.firstName} {dept.head.lastName}
                              {dept.head.jobTitle ? ` — ${dept.head.jobTitle}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingDept(dept.id);
                            setEditDeptForm({ name: dept.name, description: dept.description ?? "" });
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingDept === dept.id || dept._count.employees > 0}
                            title={dept._count.employees > 0 ? "Cannot delete — has employees" : "Delete department"}
                            onClick={() => {
                              if (confirm(`Delete department "${dept.name}"?`)) handleDeleteDept(dept.id);
                            }}
                          >
                            {deletingDept === dept.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No departments yet. Add your first one above.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
