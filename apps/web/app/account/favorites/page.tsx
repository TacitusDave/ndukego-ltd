import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { getWebSession } from "@/lib/auth";
import { publicFetch, mediaUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { RemoveFavoriteButton } from "./remove-favorite-button";

interface FavoriteProperty {
  id: string;
  title: string;
  state: string;
  city: string | null;
  listingPrice: string | null;
  category: string;
  status: string;
  media: { url: string }[];
}

interface Favorite {
  id: string;
  property: FavoriteProperty;
}

interface CustomerProfile {
  favorites: Favorite[];
}

const CATEGORY_LABEL: Record<string, string> = {
  LAND: "Land", HOUSE: "House", DUPLEX: "Duplex", BUNGALOW: "Bungalow",
  APARTMENT: "Apartment", COMMERCIAL: "Commercial", WAREHOUSE: "Warehouse",
  OFFICE: "Office", SHOP: "Shop", HOTEL: "Hotel", ESTATE_PLOT: "Estate Plot",
  FARM_LAND: "Farm Land", MIXED_USE: "Mixed Use", INDUSTRIAL: "Industrial",
  LUXURY_HOME: "Luxury Home", PROJECT_DEVELOPMENT: "Project Development",
};

export default async function FavoritesPage() {
  const session = await getWebSession();
  if (!session) return null;

  const { data: profile } = await publicFetch<CustomerProfile>("/auth/customer/me", {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  const favorites = profile?.favorites ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/[0.06] bg-white/80 px-6 py-5 shadow-sm shadow-black/[0.03] backdrop-blur">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
          Saved Properties
        </h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {favorites.length} saved propert{favorites.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-3xl border border-black/[0.06] bg-white/80 p-12 text-center shadow-sm backdrop-blur">
          <Heart className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-700">No saved properties</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
            When you find a property you like, save it here to compare or revisit later.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#A0111C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B41523]"
          >
            Browse properties <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {favorites.map((fav) => {
            const cover = fav.property.media[0];
            return (
              <div
                key={fav.id}
                className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white/80 shadow-sm shadow-black/[0.03] backdrop-blur transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/9] bg-gray-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(cover.url)}
                      alt={fav.property.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <Heart className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <span className="rounded-full bg-[#A0111C] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      {CATEGORY_LABEL[fav.property.category] ?? fav.property.category}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <p className="font-semibold leading-tight text-gray-900">{fav.property.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {fav.property.city ? `${fav.property.city}, ` : ""}{fav.property.state}
                    </p>
                    {fav.property.listingPrice && (
                      <p className="mt-1 font-bold text-[#A0111C]">{formatCurrency(fav.property.listingPrice)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/properties/${fav.property.id}`}
                      className="flex-1 rounded-full bg-[#A0111C] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#B41523]"
                    >
                      View property
                    </Link>
                    <RemoveFavoriteButton propertyId={fav.property.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
