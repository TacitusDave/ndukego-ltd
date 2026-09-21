"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, UploadCloud, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface Poster {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const API_IMAGE_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:4000";

function posterImageUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_IMAGE_BASE}${url}`;
}

// ─── Upload dialog ───────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onClose,
  poster,
}: {
  open: boolean;
  onClose: () => void;
  poster: Poster | null; // null = new upload
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState(poster?.title ?? "");
  const [description, setDescription] = useState(poster?.description ?? "");
  const [linkUrl, setLinkUrl] = useState(poster?.linkUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = poster != null;

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !file) {
      setError("Please choose a poster image (portrait 4:5 works best)");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (title) fd.append("title", title);
      if (description) fd.append("description", description);
      if (linkUrl) fd.append("linkUrl", linkUrl);

      const res = await fetch(
        isEdit ? `/api/proxy/posters/${poster!.id}` : "/api/proxy/posters",
        {
          method: isEdit ? "PATCH" : "POST",
          body: fd,
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(body.message) ? body.message.join(", ") : body.message ?? "Upload failed",
        );
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-card shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit poster" : "Upload poster"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Portrait posters look best · JPEG, PNG, WebP · up to 5 MB
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image picker */}
            <div>
              <Label>Poster image *</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "mt-1.5 w-full rounded-lg border-2 border-dashed overflow-hidden transition-colors",
                  preview || (isEdit && poster.imageUrl)
                    ? "border-transparent"
                    : "border-border hover:border-primary/50",
                )}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Poster preview"
                    className="w-full max-h-72 object-contain bg-muted"
                  />
                ) : isEdit && poster.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={posterImageUrl(poster.imageUrl)}
                    alt="Current poster"
                    className="w-full max-h-72 object-contain bg-muted"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to choose an image</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: portrait orientation (e.g. 1080 × 1350)
                    </p>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="poster-title">Title</Label>
              <Input
                id="poster-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Greenfield Estates — 30% Launch Discount"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="poster-desc">Description</Label>
              <Textarea
                id="poster-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short caption shown under the poster"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="poster-link">Link (optional)</Label>
              <Input
                id="poster-link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://… — 'View details' opens this"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {isEdit ? "Saving…" : "Uploading…"}
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Upload poster"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Manager ─────────────────────────────────────────────────────────────────

export function PosterManager({ initialPosters }: { initialPosters: Poster[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Poster | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this poster? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/proxy/posters/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Delete failed");
    }
    setBusyId(null);
    router.refresh();
  }

  async function handleToggle(poster: Poster) {
    setBusyId(poster.id);
    setError(null);
    const res = await fetch(`/api/proxy/posters/${poster.id}/toggle`, { method: "PATCH" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Update failed");
    }
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Marketing posters</h2>
          <p className="text-xs text-muted-foreground">
            {initialPosters.length} poster{initialPosters.length !== 1 ? "s" : ""} · shown on the
            Real Estate page
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <ImagePlus className="mr-1.5 h-4 w-4" />
          Upload poster
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {initialPosters.length === 0 ? (
        <button
          type="button"
          className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center hover:border-primary/50 transition-colors"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Upload your first poster</p>
          <p className="text-xs text-muted-foreground mt-1">
            Portrait orientation recommended · JPEG, PNG, WebP · Max 5 MB
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {initialPosters.map((poster) => (
            <div
              key={poster.id}
              className={cn(
                "group relative rounded-lg overflow-hidden border bg-muted",
                !poster.isActive && "opacity-60",
              )}
            >
              <div className="aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterImageUrl(poster.imageUrl)}
                  alt={poster.title ?? "Poster"}
                  className="w-full h-full object-cover"
                />
              </div>

              {!poster.isActive && (
                <div className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Hidden
                </div>
              )}

              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                {poster.title && (
                  <p className="text-white text-xs font-medium text-center line-clamp-2">
                    {poster.title}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title={poster.isActive ? "Hide from website" : "Show on website"}
                    disabled={busyId === poster.id}
                    onClick={() => handleToggle(poster)}
                    className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {busyId === poster.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : poster.isActive ? (
                      <EyeOff className="h-3.5 w-3.5 text-gray-700" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-gray-700" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Edit poster"
                    onClick={() => {
                      setEditing(poster);
                      setDialogOpen(true);
                    }}
                    className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ImagePlus className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    title="Delete poster"
                    disabled={busyId === poster.id}
                    onClick={() => handleDelete(poster.id)}
                    className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {busyId === poster.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        poster={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
