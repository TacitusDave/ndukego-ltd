"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Star, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

interface Media {
  id: string;
  url: string;
  title: string | null;
  isCover: boolean;
  sortOrder: number;
  type: string;
}

export function PropertyMedia({
  propertyId,
  media,
}: {
  propertyId: string;
  media: Media[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coveringId, setCoveringId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`${file.name} exceeds the 10 MB limit`);
        continue;
      }

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/proxy/properties/${propertyId}/media`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUploadError(
          Array.isArray(body.message)
            ? body.message.join(", ")
            : (body.message ?? `Upload failed for ${file.name}`),
        );
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function handleDelete(mediaId: string) {
    setDeletingId(mediaId);

    await fetch(`/api/proxy/properties/${propertyId}/media`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });

    setDeletingId(null);
    router.refresh();
  }

  async function handleSetCover(mediaId: string) {
    setCoveringId(mediaId);

    await fetch(`/api/proxy/properties/${propertyId}/media/${mediaId}/cover`, {
      method: "PATCH",
    });

    setCoveringId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Photos</h2>
          <p className="text-xs text-muted-foreground">
            {media.length} image{media.length !== 1 ? "s" : ""} · JPEG, PNG, WebP up to 10 MB each
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="mr-1.5 h-4 w-4" />
              Add photos
            </>
          )}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {media.length === 0 && !uploading && (
        <button
          type="button"
          className="w-full flex flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Add property photos</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to upload · JPEG, PNG, WebP · Max 10 MB each
          </p>
        </button>
      )}

      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((m) => (
            <div
              key={m.id}
              className={cn(
                "group relative rounded-md overflow-hidden border bg-muted aspect-square",
                m.isCover && "ring-2 ring-primary ring-offset-1",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(m.url)}
                alt={m.title ?? "Property image"}
                className="w-full h-full object-cover"
              />

              {m.isCover && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                  Cover
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!m.isCover && (
                  <button
                    type="button"
                    title="Set as cover photo"
                    disabled={coveringId === m.id}
                    onClick={() => handleSetCover(m.id)}
                    className="rounded-full bg-white/90 p-1.5 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {coveringId === m.id ? (
                      <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4 text-yellow-600" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  title="Delete image"
                  disabled={deletingId === m.id}
                  onClick={() => handleDelete(m.id)}
                  className="rounded-full bg-white/90 p-1.5 hover:bg-white transition-colors disabled:opacity-50"
                >
                  {deletingId === m.id ? (
                    <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Upload tile */}
          <button
            type="button"
            disabled={uploading}
            className="flex flex-col items-center justify-center rounded-md border-2 border-dashed aspect-square hover:border-primary/50 transition-colors disabled:opacity-50"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground mt-1">
              {uploading ? "Uploading…" : "Add more"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
