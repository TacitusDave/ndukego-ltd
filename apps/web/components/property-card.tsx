"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MapPin, Bed, Bath, Maximize2, Building2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { mediaUrl } from "@/lib/api";
import { FavoriteButton } from "@/components/favorite-button";

interface Media {
  url: string;
  isCover: boolean;
}

interface Estate {
  name: string;
}

export interface PropertyCardData {
  id: string;
  title: string;
  status: string;
  category: string;
  type: string;
  state: string;
  city: string | null;
  listingPrice: string | null;
  landSize: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  latitude: string | null;
  longitude: string | null;
  media: Media[];
  estate: Estate | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  LAND: "Land",
  HOUSE: "House",
  DUPLEX: "Duplex",
  BUNGALOW: "Bungalow",
  APARTMENT: "Apartment",
  COMMERCIAL: "Commercial",
  WAREHOUSE: "Warehouse",
  OFFICE: "Office",
  SHOP: "Shop",
  HOTEL: "Hotel",
  ESTATE_PLOT: "Estate Plot",
  FARM_LAND: "Farm Land",
  MIXED_USE: "Mixed Use",
  INDUSTRIAL: "Industrial",
  LUXURY_HOME: "Luxury Home",
  PROJECT_DEVELOPMENT: "Project Dev",
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const cover = property.media.find((m) => m.isCover) ?? property.media[0];
  const [imgFailed, setImgFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Images can fail before hydration, in which case the error event fires
  // before React attaches listeners — re-check via the DOM on mount.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setImgFailed(true);
  }, []);

  const showImage = cover && !imgFailed;

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={mediaUrl(cover.url)}
            alt={property.title}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                <Maximize2 className="h-5 w-5" />
              </div>
              <p className="text-xs">No image yet</p>
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="rounded-full bg-[#A0111C] px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {CATEGORY_LABEL[property.category] ?? property.category}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <div className="rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm">
            <FavoriteButton propertyId={property.id} iconOnly />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-[#A0111C] transition-colors duration-150">
          {property.title}
        </p>

        {property.estate && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              <Building2 className="h-2.5 w-2.5" />
              {property.estate.name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {property.city ? `${property.city}, ` : ""}{property.state}
          </span>
        </div>

        {/* Specs */}
        {(property.bedrooms || property.bathrooms || property.landSize) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {property.bedrooms != null && (
              <span className={cn("flex items-center gap-1")}>
                <Bed className="h-3 w-3" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {property.bathrooms}
              </span>
            )}
            {property.landSize && (
              <span className="flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                {property.landSize} sqm
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-2 border-t border-border">
          {property.listingPrice ? (
            <p className="text-base font-bold text-[#A0111C]">
              {formatCurrency(property.listingPrice)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Price on request</p>
          )}
        </div>
      </div>
    </Link>
  );
}
