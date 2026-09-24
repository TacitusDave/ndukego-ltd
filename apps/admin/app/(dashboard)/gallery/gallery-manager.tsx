"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
  Eye,
  EyeOff,
  Film,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

export interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  type?: string | null; // IMAGE | VIDEO | COLLAGE (legacy rows may be null)
  mediaUrl?: string | null;
  posterFrameUrl?: string | null;
  width: number | null;
  height: number | null;
  groupName: string | null;
  sortOrder: number;
  isActive: boolean;
}

const IMAGE_MAX_MB = 12;
const VIDEO_MAX_MB = 150;

function kindOf(item: GalleryItem): "IMAGE" | "VIDEO" | "COLLAGE" {
  if (item.type === "VIDEO" || item.type === "COLLAGE") return item.type;
  if (item.type === "IMAGE") return "IMAGE";
  // Legacy poster rows: any webm/mp4/mov path is a video, otherwise image.
  if (/\.(mp4|webm|mov)(\?|$)/i.test(item.imageUrl ?? "")) return "VIDEO";
  return "IMAGE";
}

/** Read an image file's natural dimensions in the browser before upload. */
function detectImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function orientationLabel(w?: number | null, h?: number | null) {
  if (!w || !h) return null;
  const r = w / h;
  if (r > 1.05) return "Landscape";
  if (r < 0.95) return "Portrait";
  return "Square";
}

// ─── Upload dialog ───────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: GalleryItem | null; // null = new upload
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"IMAGE" | "VIDEO" | "COLLAGE">(
    item ? kindOf(item) : "IMAGE",
  );
  const [file, setFile] = useState<File | null>(null);
  const [frame, setFrame] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [linkUrl, setLinkUrl] = useState(item?.linkUrl ?? "");
  const [groupName, setGroupName] = useState(item?.groupName ?? "");
  const [width, setWidth] = useState(item?.width ? String(item.width) : "");
  const [height, setHeight] = useState(item?.height ? String(item.height) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = item != null;
  const isVideo = kind === "VIDEO";
  const orient = orientationLabel(Number(width), Number(height));
  const maxMb = isVideo ? VIDEO_MAX_MB : IMAGE_MAX_MB;

  async function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > maxMb * 1024 * 1024) {
      setError(`File must be smaller than ${maxMb} MB`);
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!isVideo) {
      const dims = await detectImageDimensions(f);
      if (dims) {
        setWidth(String(dims.width));
        setHeight(String(dims.height));
      }
    }
  }

  function pickFrame(f: File | null) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Poster frame must be smaller than 5 MB");
      return;
    }
    setError(null);
    setFrame(f);
    setFramePreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !file) {
      setError(isVideo ? "Please choose a video file" : "Please choose an image");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (frame) fd.append("frame", frame);
      if (title) fd.append("title", title);
      if (description) fd.append("description", description);
      if (linkUrl) fd.append("linkUrl", linkUrl);
      if (!isEdit) fd.append("type", kind);
      fd.append("groupName", groupName); // empty string clears the group
      if (width) fd.append("width", width);
      if (height) fd.append("height", height);

      const res = await fetch(
        isEdit ? `/api/proxy/gallery/${item!.id}` : "/api/proxy/gallery",
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

  const currentIsVideo = item ? kindOf(item) === "VIDEO" : false;
  const gridSrc = item
    ? currentIsVideo && item.posterFrameUrl
      ? item.posterFrameUrl
      : item.imageUrl
    : null;

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
              {isEdit ? "Edit gallery item" : "Add to gallery"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Photos, videos, and collages · JPEG, PNG, WebP {isVideo ? "· MP4, WebM, MOV" : ""} · up to {maxMb} MB
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isEdit && (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "IMAGE", label: "Photo", icon: ImagePlus },
                  { value: "VIDEO", label: "Video", icon: Film },
                  { value: "COLLAGE", label: "Collage", icon: LayoutGrid },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors",
                    kind === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Media picker */}
            <div>
              <Label>{isVideo ? "Video file *" : "Image file *"}</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "mt-1.5 w-full rounded-lg border-2 border-dashed overflow-hidden transition-colors",
                  preview || (isEdit && gridSrc)
                    ? "border-transparent"
                    : "border-border hover:border-primary/50",
                )}
              >
                {preview ? (
                  isVideo ? (
                    <video src={preview} className="w-full max-h-72 bg-muted" controls={false} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-72 object-contain bg-muted"
                    />
                  )
                ) : isEdit && gridSrc ? (
                  currentIsVideo && item.posterFrameUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(item.posterFrameUrl)}
                      alt="Current item"
                      className="w-full max-h-72 object-contain bg-muted"
                    />
                  ) : currentIsVideo ? (
                    <video src={mediaUrl(item.imageUrl)} className="w-full max-h-72 bg-muted" controls={false} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(item.imageUrl)}
                      alt="Current item"
                      className="w-full max-h-72 object-contain bg-muted"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {isVideo ? "Click to choose a video" : "Click to choose an image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isVideo
                        ? "MP4 or WebM recommended · add a poster frame below"
                        : "Any size or shape works — the gallery adapts"}
                    </p>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={isVideo ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp"}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Video poster frame */}
            {isVideo && (
              <div>
                <Label>Poster frame (optional)</Label>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Shown in the grid before the video plays. A frame is picked automatically if omitted.
                </p>
                <button
                  type="button"
                  onClick={() => frameRef.current?.click()}
                  className={cn(
                    "w-full rounded-lg border-2 border-dashed overflow-hidden transition-colors",
                    framePreview ? "border-transparent" : "border-border hover:border-primary/50",
                  )}
                >
                  {framePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={framePreview} alt="Frame preview" className="w-full max-h-40 object-contain bg-muted" />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4">
                      <ImagePlus className="h-6 w-6 text-muted-foreground mb-1.5" />
                      <p className="text-sm font-medium">Choose a frame image</p>
                    </div>
                  )}
                </button>
                <input
                  ref={frameRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => pickFrame(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="gallery-title">Title</Label>
              <Input
                id="gallery-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Greenfield Estates — Site Tour"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gallery-desc">Description</Label>
              <Textarea
                id="gallery-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short caption shown in the lightbox"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gallery-link">Link (optional)</Label>
              <Input
                id="gallery-link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://… — 'View details' opens this"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gallery-group">Group / campaign (optional)</Label>
              <Input
                id="gallery-group"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Jahi Terraces Launch — items sharing a group appear together"
              />
            </div>

            {!isVideo && (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div className="grid gap-1">
                  <Label htmlFor="gallery-width">Width (px)</Label>
                  <Input
                    id="gallery-width"
                    inputMode="numeric"
                    value={width}
                    onChange={(e) => setWidth(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="auto"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="gallery-height">Height (px)</Label>
                  <Input
                    id="gallery-height"
                    inputMode="numeric"
                    value={height}
                    onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="auto"
                  />
                </div>
                <div className="pb-2 text-xs text-muted-foreground whitespace-nowrap">
                  {orient ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                      {orient}
                    </span>
                  ) : (
                    "detected automatically"
                  )}
                </div>
              </div>
            )}

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
                  "Add to gallery"
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

export function GalleryManager({ initialItems }: { initialItems: GalleryItem[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this gallery item? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/proxy/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Delete failed");
    }
    setBusyId(null);
    router.refresh();
  }

  async function handleToggle(item: GalleryItem) {
    setBusyId(item.id);
    setError(null);
    const res = await fetch(`/api/proxy/gallery/${item.id}/toggle`, { method: "PATCH" });
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
          <h2 className="text-sm font-semibold">Website gallery</h2>
          <p className="text-xs text-muted-foreground">
            {initialItems.length} item{initialItems.length !== 1 ? "s" : ""} · shown on the
            public Gallery page — photos, videos, and collages
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
          Add to gallery
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {initialItems.length === 0 ? (
        <button
          type="button"
          className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center hover:border-primary/50 transition-colors"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Add your first gallery item</p>
          <p className="text-xs text-muted-foreground mt-1">
            Photos, videos, or collages · JPEG, PNG, WebP, MP4, WebM
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {initialItems.map((item) => {
            const kind = kindOf(item);
            const isVideo = kind === "VIDEO";
            const tileSrc = isVideo && item.posterFrameUrl ? item.posterFrameUrl : item.imageUrl;
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative rounded-lg overflow-hidden border bg-muted",
                  !item.isActive && "opacity-60",
                )}
              >
                <div
                  className="overflow-hidden"
                  style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : "4 / 5" }}
                >
                  {isVideo && !item.posterFrameUrl ? (
                    <video
                      src={mediaUrl(item.imageUrl)}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(tileSrc)}
                      alt={item.title ?? "Gallery item"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {kind === "VIDEO" && (
                    <span className="bg-black/60 text-white rounded p-1">
                      <Film className="h-3 w-3" />
                    </span>
                  )}
                  {kind === "COLLAGE" && (
                    <span className="bg-black/60 text-white rounded p-1">
                      <LayoutGrid className="h-3 w-3" />
                    </span>
                  )}
                </div>

                {(item.width || item.groupName) && (
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    {item.width && item.height && (
                      <span className="bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {item.width}×{item.height}
                      </span>
                    )}
                    {item.groupName && (
                      <span className="bg-primary/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {item.groupName}
                      </span>
                    )}
                  </div>
                )}

                {!item.isActive && (
                  <div className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    Hidden
                  </div>
                )}

                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  {item.title && (
                    <p className="text-white text-xs font-medium text-center line-clamp-2">
                      {item.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title={item.isActive ? "Hide from website" : "Show on website"}
                      disabled={busyId === item.id}
                      onClick={() => handleToggle(item)}
                      className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {busyId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : item.isActive ? (
                        <EyeOff className="h-3.5 w-3.5 text-gray-700" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-gray-700" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Edit item"
                      onClick={() => {
                        setEditing(item);
                        setDialogOpen(true);
                      }}
                      className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                    >
                      <ImagePlus className="h-3.5 w-3.5 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      title="Delete item"
                      disabled={busyId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {busyId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UploadDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        item={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
