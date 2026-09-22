import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ArrowLeft, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DocumentStatusActions } from "./document-status-actions";

interface DocumentVersion {
  id: string;
  versionNumber: number;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface DocumentDetail {
  id: string;
  documentNumber: string;
  title: string;
  category: string;
  documentType: string;
  entityType: string;
  entityId: string;
  referenceNumber: string | null;
  status: string;
  securityClassification: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  originalFilename: string;
  storagePath: string;
  expirationDate: string | null;
  uploadDate: string;
  verificationDate: string | null;
  approvalDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  downloadRestricted: boolean;
  watermarkEnabled: boolean;
  currentVersion: number;
  versions: DocumentVersion[];
}

const STATUS_STYLES: Record<string, string> = {
  UPLOADED:  "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400",
  SCANNING:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  ASSIGNED:  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  VERIFIED:  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
  APPROVED:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  REJECTED:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  ARCHIVED:  "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500",
  EXPIRED:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLabel(str: string) {
  return str.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data: doc, error } = await apiFetch<DocumentDetail>(`/documents/${id}`);

  // A deleted/gone record is a genuine 404; auth or server errors must not
  // render "Page not found" — show an explanatory error screen instead.
  if (error && /token|unauthorized|forbidden|reach api/i.test(error)) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="max-w-md rounded-lg border border-red-100 bg-red-50/60 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">Could not load this document</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <Link href="/documents" className="mt-4 inline-block text-xs font-semibold text-red-700 underline">
            Back to documents
          </Link>
        </div>
      </div>
    );
  }
  if (error || !doc) notFound();

  const isExpired = doc.expirationDate
    ? new Date(doc.expirationDate) < new Date()
    : false;

  return (
    <div className="flex flex-col h-full">
      <Header title={doc.title}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/api/proxy/documents/${id}/download`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-1 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </Header>

      <div className="flex-1 overflow-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to documents
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — main info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header card */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted shrink-0">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[doc.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {doc.status.toLowerCase()}
                    </span>
                    {isExpired && (
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">
                        Expired
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold break-words">{doc.title}</h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {doc.documentNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Document metadata */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Document details
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Category</dt>
                  <dd className="font-medium">{formatLabel(doc.category)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Document type</dt>
                  <dd className="font-medium">{formatLabel(doc.documentType)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Entity type</dt>
                  <dd className="font-medium">{formatLabel(doc.entityType)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Entity ID</dt>
                  <dd className="font-mono text-xs truncate" title={doc.entityId}>
                    {doc.entityId}
                  </dd>
                </div>
                {doc.referenceNumber && (
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Reference no.</dt>
                    <dd className="font-medium">{doc.referenceNumber}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Classification</dt>
                  <dd className="font-medium">{formatLabel(doc.securityClassification)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">File name</dt>
                  <dd className="truncate text-xs">{doc.originalFilename}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">File size</dt>
                  <dd>{formatBytes(doc.fileSize)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Uploaded</dt>
                  <dd>{formatDate(doc.uploadDate)}</dd>
                </div>
                {doc.verificationDate && (
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Verified</dt>
                    <dd>{formatDate(doc.verificationDate)}</dd>
                  </div>
                )}
                {doc.approvalDate && (
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Approved</dt>
                    <dd>{formatDate(doc.approvalDate)}</dd>
                  </div>
                )}
                {doc.expirationDate && (
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Expires</dt>
                    <dd className={isExpired ? "text-orange-600 font-semibold" : ""}>
                      {formatDate(doc.expirationDate)}
                    </dd>
                  </div>
                )}
              </dl>

              {doc.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-xs text-muted-foreground mb-2">Tags</dt>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Version history */}
            {doc.versions.length > 0 && (
              <div className="rounded-xl border bg-card p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Version history
                </h3>
                <div className="space-y-3">
                  {doc.versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          v{v.versionNumber}
                        </span>
                        <div>
                          <p className="font-medium text-xs">{v.originalFilename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(v.fileSize)} · {formatDate(v.createdAt)}
                          </p>
                        </div>
                      </div>
                      {v.versionNumber === doc.currentVersion && (
                        <span className="text-xs text-muted-foreground">current</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — actions */}
          <div className="space-y-4">
            <DocumentStatusActions documentId={id} currentStatus={doc.status} />

            <div className="rounded-xl border bg-card p-5 space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Flags
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Download restricted</span>
                <span className={doc.downloadRestricted ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {doc.downloadRestricted ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Watermark</span>
                <span className={doc.watermarkEnabled ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {doc.watermarkEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
