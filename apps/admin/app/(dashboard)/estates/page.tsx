import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CreateEstateButton } from "./create-estate-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Estate {
  id: string;
  name: string;
  code: string;
  state: string;
  city: string | null;
  status: string;
  totalPlots: number | null;
  availablePlots: number | null;
  _count: { properties: number };
  createdAt: string;
}

interface EstatesResponse {
  items: Estate[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  UNDER_DEVELOPMENT: "Under development",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export default async function EstatesPage() {
  const { data, error } = await apiFetch<EstatesResponse>("/estates?limit=50");

  return (
    <div className="flex flex-col h-full">
      <Header title="Estates">
        <CreateEstateButton />
      </Header>

      <div className="flex-1 p-6 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load estates: {error}
          </div>
        )}

        {!error && data && (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Plots</TableHead>
                  <TableHead className="text-right">Properties</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No estates yet.{" "}
                      <Link href="/estates/new" className="underline">
                        Create the first one
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link href={`/estates/${e.id}`} className="font-medium hover:underline">
                        {e.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {e.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.status as never}>
                        {STATUS_LABELS[e.status] ?? e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.city ? `${e.city}, ` : ""}{e.state}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {e.availablePlots ?? "—"} / {e.totalPlots ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {e._count.properties}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(e.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
