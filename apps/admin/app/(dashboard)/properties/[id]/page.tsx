import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PropertyStatusBadge } from "../property-status-badge";
import { PropertyActions } from "./property-actions";
import { PropertyEditForm } from "./property-edit-form";
import { PropertyMedia } from "./property-media";
import { PropertyFeaturedToggle } from "./property-featured-toggle";
import { PropertyDeleteButton } from "./property-delete-button";

interface MediaItem {
  id: string;
  url: string;
  title: string | null;
  isCover: boolean;
  sortOrder: number;
  type: string;
}

interface Property {
  id: string;
  internalNumber: string;
  title: string;
  status: string;
  category: string;
  type: string;
  state: string;
  lga: string | null;
  city: string | null;
  description: string | null;
  shortDescription: string | null;
  listingPrice: string | null;
  landSize: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  installmentAllowed: boolean;
  reservationAmount: string | null;
  featured: boolean;
  amenities: string[];
  mapUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  estate: { id: string; name: string; code: string } | null;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: property, error } = await apiFetch<Property>(`/properties/${id}`);

  // A deleted/gone record is a genuine 404; auth or server errors must not
  // render "Page not found" — show an explanatory error screen instead.
  if (error && /token|unauthorized|forbidden|reach api/i.test(error)) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="max-w-md rounded-lg border border-red-100 bg-red-50/60 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">Could not load this property</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <Link href="/properties" className="mt-4 inline-block text-xs font-semibold text-red-700 underline">
            Back to properties
          </Link>
        </div>
      </div>
    );
  }
  if (error || !property) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header title={property.internalNumber}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/properties">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to properties
          </Link>
        </Button>
      </Header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl space-y-6">

          {/* Danger zone */}
          <div className="flex items-center justify-between rounded-md border border-red-100 bg-red-50/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-red-700">Danger zone</p>
              <p className="text-xs text-red-500">Permanently delete this property and all its data</p>
            </div>
            <PropertyDeleteButton propertyId={property.id} propertyTitle={property.title} />
          </div>

          {/* Featured toggle */}
          <PropertyFeaturedToggle propertyId={property.id} featured={property.featured} />

          {/* Status + transition */}
          <div className="rounded-md border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</p>
                <PropertyStatusBadge status={property.status} />
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Updated {formatDate(property.updatedAt)}</p>
                <p>Created {formatDate(property.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Move to</p>
              <PropertyActions propertyId={property.id} currentStatus={property.status} />
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-md border bg-card p-5">
            <PropertyMedia propertyId={property.id} media={property.media} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: summary card */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-md border bg-card p-5 space-y-3">
                <h2 className="text-sm font-semibold">Summary</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ref</dt>
                    <dd className="font-mono text-xs">{property.internalNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="capitalize">{property.category.replace(/_/g, " ").toLowerCase()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="capitalize">{property.type.replace(/_/g, " ").toLowerCase()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd>{property.city ? `${property.city}, ` : ""}{property.state}</dd>
                  </div>
                  {property.lga && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">LGA</dt>
                      <dd>{property.lga}</dd>
                    </div>
                  )}
                  {property.estate && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Estate</dt>
                      <dd>
                        <Link href={`/estates/${property.estate.id}`} className="hover:underline">
                          {property.estate.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {property.listingPrice && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="font-semibold">{formatCurrency(Number(property.listingPrice))}</dd>
                    </div>
                  )}
                  {property.reservationAmount && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Reservation</dt>
                      <dd>{formatCurrency(Number(property.reservationAmount))}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Installment</dt>
                    <dd>{property.installmentAllowed ? "Yes" : "No"}</dd>
                  </div>
                  {property.landSize && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Land size</dt>
                      <dd>{property.landSize} sqm</dd>
                    </div>
                  )}
                  {property.bedrooms != null && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Beds / Baths</dt>
                      <dd>{property.bedrooms} / {property.bathrooms ?? "—"}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Right: edit form */}
            <div className="lg:col-span-2">
              <div className="rounded-md border bg-card p-5 space-y-4">
                <h2 className="text-sm font-semibold">Edit details</h2>
                <PropertyEditForm property={property} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
