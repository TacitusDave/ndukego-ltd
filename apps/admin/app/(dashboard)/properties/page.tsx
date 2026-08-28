import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyStatusBadge } from "./property-status-badge";
import { PropertyFilters } from "./property-filters";
import { CreatePropertyButton } from "./create-property-button";

interface Property {
  id: string;
  internalNumber: string;
  title: string;
  status: string;
  category: string;
  type: string;
  state: string;
  city: string | null;
  listingPrice: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  estate: { id: string; name: string } | null;
  createdAt: string;
}

interface PropertiesResponse {
  items: Property[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ?? "1";
  const status = params.status ?? "";
  const category = params.category ?? "";
  const search = params.search ?? "";

  const queryParts = [`page=${page}`, "limit=25"];
  if (status) queryParts.push(`status=${status}`);
  if (category) queryParts.push(`category=${category}`);
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);

  const { data, error } = await apiFetch<PropertiesResponse>(
    `/properties?${queryParts.join("&")}`,
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Properties">
        <CreatePropertyButton />
      </Header>

      <div className="flex-1 p-6 space-y-4">
        <PropertyFilters currentStatus={status} currentCategory={category} currentSearch={search} />

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load properties: {error}
          </div>
        )}

        {!error && data && (
          <>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Estate</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No properties found.{" "}
                        <Link href="/properties/new" className="underline">
                          Add the first one
                        </Link>
                      </TableCell>
                    </TableRow>
                  )}
                  {data.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {p.internalNumber}
                      </TableCell>
                      <TableCell>
                        <Link href={`/properties/${p.id}`} className="font-medium hover:underline">
                          {p.title}
                        </Link>
                        {p.bedrooms != null && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.bedrooms} bed · {p.bathrooms ?? "—"} bath
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <PropertyStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {p.category.replace(/_/g, " ").toLowerCase()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.city ? `${p.city}, ` : ""}{p.state}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.estate?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {p.listingPrice ? formatCurrency(Number(p.listingPrice)) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(p.createdAt)}
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
                  {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of{" "}
                  {data.meta.total}
                </span>
                <div className="flex gap-2">
                  {data.meta.page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties?page=${data.meta.page - 1}${status ? `&status=${status}` : ""}${category ? `&category=${category}` : ""}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {data.meta.page < data.meta.totalPages && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties?page=${data.meta.page + 1}${status ? `&status=${status}` : ""}${category ? `&category=${category}` : ""}`}>
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
