import Link from "next/link";
import { Header } from "@/components/layout/header";
import { apiFetch } from "@/lib/api";
import { ScheduleInspectionButton } from "./schedule-inspection-button";
import { formatDate } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { InspectionFilters } from "./inspection-filters";

interface Inspector { id: string; firstName: string; lastName: string; jobTitle: string | null }
interface Property  { id: string; title: string; state: string; city: string | null }
interface Customer  { id: string; firstName: string | null; lastName: string | null }

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  recommendation: string | null;
  overallScore: number | null;
  property: Property;
  inspector: Inspector;
  customer: Customer | null;
}

interface InspectionsResponse {
  items: Inspection[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  CANCELLED:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500",
  FAILED:      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const REC_STYLES: Record<string, string> = {
  APPROVE:                  "text-green-600 dark:text-green-400",
  APPROVE_WITH_CONDITIONS:  "text-amber-600 dark:text-amber-400",
  REJECT:                   "text-red-600 dark:text-red-400",
  NEEDS_FOLLOW_UP:          "text-purple-600 dark:text-purple-400",
};

function fmtLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function InspectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page   = params.page   ?? "1";
  const search = params.search ?? "";
  const status = params.status ?? "";
  const type   = params.type   ?? "";

  const q = [`page=${page}`, "limit=25"];
  if (search) q.push(`search=${encodeURIComponent(search)}`);
  if (status) q.push(`status=${status}`);
  if (type)   q.push(`type=${type}`);

  const { data, error } = await apiFetch<InspectionsResponse>(`/inspections?${q.join("&")}`);

  return (
    <div className="flex flex-col h-full">
      <Header title="Inspections">
        <ScheduleInspectionButton />
      </Header>

      <div className="flex-1 p-6 space-y-4">
        <InspectionFilters currentStatus={status} currentType={type} currentSearch={search} />

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load inspections: {error}
          </div>
        )}

        {!error && data && (
          <>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No inspections found.{" "}
                        <Link href="/inspections/new" className="underline">Schedule the first one</Link>
                      </TableCell>
                    </TableRow>
                  )}
                  {data.items.map((insp) => (
                    <TableRow key={insp.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {insp.inspectionNumber}
                      </TableCell>
                      <TableCell>
                        <Link href={`/inspections/${insp.id}`} className="font-medium hover:underline">
                          {insp.property.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {insp.property.city ? `${insp.property.city}, ` : ""}{insp.property.state}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{fmtLabel(insp.type)}</TableCell>
                      <TableCell className="text-sm">
                        {insp.inspector.firstName} {insp.inspector.lastName}
                        {insp.inspector.jobTitle && (
                          <div className="text-xs text-muted-foreground">{insp.inspector.jobTitle}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[insp.status] ?? ""}`}>
                          {fmtLabel(insp.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(insp.scheduledAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {insp.recommendation ? (
                          <span className={`font-medium ${REC_STYLES[insp.recommendation] ?? ""}`}>
                            {fmtLabel(insp.recommendation)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {(data.meta.page - 1) * data.meta.limit + 1}–
                  {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total}
                </span>
                <div className="flex gap-2">
                  {data.meta.page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/inspections?page=${data.meta.page - 1}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {data.meta.page < data.meta.totalPages && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/inspections?page=${data.meta.page + 1}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
