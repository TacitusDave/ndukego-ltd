"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, ImagePlus, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateEstateBuildingTypes } from "@/lib/actions";

const API_IMAGE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:4000";

export interface BuildingType {
  id: string;
  name: string;
  colorHex: string;
  description: string;
  images: string[];
  comingSoon: boolean;
}

interface Props {
  estateId: string;
  masterPlanUrl: string | null;
  buildingTypes: BuildingType[];
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

export function EstateSitePlanManager({ estateId, masterPlanUrl, buildingTypes: initial }: Props) {
  const [sitePlanUrl, setSitePlanUrl] = useState<string | null>(masterPlanUrl);
  const [types, setTypes] = useState<BuildingType[]>(initial ?? []);
  const [saving, startSave] = useTransition();
  const [uploadingPlan, setUploadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const planInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ─── Site plan upload ───────────────────────────────────────────
  async function handlePlanUpload(file: File) {
    setUploadingPlan(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/proxy/estates/${estateId}/site-plan`, { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.message ?? "Upload failed");
      } else {
        const j = await res.json();
        setSitePlanUrl(j.url);
        router.refresh();
      }
    } catch {
      setError("Cannot reach API server");
    } finally {
      setUploadingPlan(false);
    }
  }

  // ─── Building type helpers ──────────────────────────────────────
  function addType() {
    const id = crypto.randomUUID();
    setTypes((prev) => [
      ...prev,
      { id, name: "New Building Type", colorHex: "#888888", description: "", images: [], comingSoon: false },
    ]);
  }

  function removeType(id: string) {
    setTypes((prev) => prev.filter((t) => t.id !== id));
  }

  function updateType(id: string, patch: Partial<BuildingType>) {
    setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function uploadTypeImage(typeId: string, file: File) {
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/proxy/estates/${estateId}/building-type-image/${typeId}`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const j = await res.json();
        setTypes((prev) =>
          prev.map((t) => (t.id === typeId ? { ...t, images: [...t.images, j.url] } : t)),
        );
      } else {
        const j = await res.json().catch(() => ({}));
        setUploadError(j.message ?? `Upload failed (${res.status})`);
      }
    } catch {
      setUploadError("Cannot reach server. Check your connection and try again.");
    }
  }

  async function deleteTypeImage(typeId: string, imageUrl: string) {
    const filename = imageUrl.split("/").pop()!;
    await fetch(`/api/proxy/estates/${estateId}/building-type-image/${typeId}/${filename}`, {
      method: "DELETE",
    });
    setTypes((prev) =>
      prev.map((t) =>
        t.id === typeId ? { ...t, images: t.images.filter((u) => u !== imageUrl) } : t,
      ),
    );
  }

  // ─── Save building types ────────────────────────────────────────
  function handleSave() {
    setError(null);
    setSuccess(false);
    startSave(async () => {
      const result = await updateEstateBuildingTypes(estateId, types as unknown[]);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="rounded-md border bg-card p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Site Plan Manager</h3>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? "Saving…" : "Save building types"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Image upload failed: {uploadError}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Building types saved successfully.
        </p>
      )}

      {/* ── Site Plan Image ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Site Plan Image
          </p>
          <input
            ref={planInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePlanUpload(e.target.files[0])}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => planInputRef.current?.click()}
            disabled={uploadingPlan}
          >
            {uploadingPlan ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-2 h-3.5 w-3.5" />
            )}
            {sitePlanUrl ? "Replace" : "Upload"} site plan
          </Button>
        </div>
        {sitePlanUrl ? (
          <div className="rounded-lg border overflow-hidden bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${API_IMAGE_BASE}${sitePlanUrl}`}
              alt="Site plan"
              className="w-full max-h-64 object-contain"
            />
            <p className="text-[10px] text-muted-foreground px-3 py-2 border-t truncate font-mono">
              {sitePlanUrl}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            No site plan uploaded yet
          </div>
        )}
      </div>

      {/* ── Building Types ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Building Types / Legend ({types.length})
          </p>
          <Button variant="outline" size="sm" onClick={addType}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add type
          </Button>
        </div>

        {types.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-4 text-center border border-dashed rounded-lg">
            No building types defined. Add building types to create a colour legend for this estate's site plan.
          </p>
        )}

        <div className="space-y-3">
          {types.map((bt) => (
            <BuildingTypeRow
              key={bt.id}
              bt={bt}
              onUpdate={(patch) => updateType(bt.id, patch)}
              onRemove={() => removeType(bt.id)}
              onUploadImage={(file) => uploadTypeImage(bt.id, file)}
              onDeleteImage={(url) => deleteTypeImage(bt.id, url)}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Pick a colour that matches the colour used in the site plan image for each building type.
        Users will click those coloured areas to see the prototype details.
      </p>
    </div>
  );
}

function BuildingTypeRow({
  bt,
  onUpdate,
  onRemove,
  onUploadImage,
  onDeleteImage,
}: {
  bt: BuildingType;
  onUpdate: (patch: Partial<BuildingType>) => void;
  onRemove: () => void;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: (url: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      await onUploadImage(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <div
          className="h-5 w-5 rounded-md border-2 border-white shadow-sm shrink-0"
          style={{ backgroundColor: bt.colorHex }}
        />
        <span className="text-sm font-medium flex-1 truncate">{bt.name || "Unnamed type"}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{bt.colorHex}</span>
        {bt.comingSoon && (
          <span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-semibold">
            Coming soon
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1 text-muted-foreground hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                type="text"
                value={bt.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="e.g. Fully Detached Duplex"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Colour in site plan
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bt.colorHex}
                  onChange={(e) => onUpdate({ colorHex: e.target.value })}
                  className="h-9 w-14 rounded cursor-pointer border p-0.5"
                />
                <input
                  type="text"
                  value={bt.colorHex}
                  onChange={(e) => onUpdate({ colorHex: e.target.value })}
                  className="flex-1 rounded-md border px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description (shown in modal)</label>
            <input
              type="text"
              value={bt.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="e.g. 4-bed fully detached luxury duplex with BQ"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={bt.comingSoon}
                onChange={(e) => onUpdate({ comingSoon: e.target.checked })}
                className="rounded"
              />
              Mark as "Coming soon" (hides images, shows placeholder)
            </label>
          </div>

          {/* Prototype Images — min 2, max 4 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Prototype images</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  bt.images.length < 2
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {bt.images.length}/4
                </span>
                {bt.images.length < 2 && (
                  <span className="text-[10px] text-amber-600">Minimum 2 required</span>
                )}
              </div>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => imgInputRef.current?.click()}
                disabled={uploading || bt.images.length >= 4}
                title={bt.images.length >= 4 ? "Maximum 4 images reached" : "Add image"}
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1.5 h-3 w-3" />
                )}
                {bt.images.length >= 4 ? "Max reached" : "Add image"}
              </Button>
            </div>

            {bt.images.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center border border-dashed rounded">
                No images yet — add at least 2 prototype images
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bt.images.map((url) => (
                  <div key={url} className="relative group rounded-md overflow-hidden border w-24 h-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_IMAGE_BASE}${url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onDeleteImage(url)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
