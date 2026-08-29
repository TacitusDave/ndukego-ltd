import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { getWebSession } from "@/lib/auth";
import { publicFetch, API_IMAGE_BASE } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

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
      <div>
        <h1 className="text-xl font-bold">Saved Properties</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {favorites.length} saved propert{favorites.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="border bg-card p-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-medium text-foreground">No saved properties</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            When you find a property you like, save it here to compare or revisit later.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-[#A0111C] px-4 py-2 text-sm font-medium text-white hover:bg-[#B41523] transition-colors"
          >
            Browse properties <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map((fav) => {
            const cover = fav.property.media[0];
            return (
              <div key={fav.id} className="border bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[16/9] bg-muted">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_IMAGE_BASE}${cover.url}`}
                      alt={fav.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Heart className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      {CATEGORY_LABEL[fav.property.category] ?? fav.property.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="font-semibold text-foreground leading-tight">{fav.property.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {fav.property.city ? `${fav.property.city}, ` : ""}{fav.property.state}
                  </p>
                  {fav.property.listingPrice && (
                    <p className="font-bold text-secondary">{formatCurrency(fav.property.listingPrice)}</p>
                  )}
                  <Link
                    href={`/properties/${fav.property.id}`}
                    className="block w-full text-center rounded-lg border border-secondary text-secondary px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-white transition-colors"
                  >
                    View property
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
