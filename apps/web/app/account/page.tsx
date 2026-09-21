import Link from "next/link";
import { CalendarCheck, Heart, ArrowRight, Building2 } from "lucide-react";
import { getWebSession } from "@/lib/auth";
import { publicFetch, mediaUrl } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReservationItem {
  id: string;
  reservationNumber: string;
  status: string;
  reservedAt: string;
  expiresAt: string;
  property: {
    id: string;
    title: string;
    state: string;
    city: string | null;
    listingPrice: string | null;
  };
}

interface FavoriteItem {
  id: string;
  property: {
    id: string;
    title: string;
    state: string;
    city: string | null;
    listingPrice: string | null;
    category: string;
    status: string;
    media: { url: string }[];
  };
}

interface CustomerProfile {
  id: string;
  customerNumber: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  reservations: ReservationItem[];
  favorites: FavoriteItem[];
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING:           { label: "Pending Review",    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400" },
  CONFIRMED:         { label: "Confirmed",          className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400" },
  EXPIRED:           { label: "Expired",            className: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-500" },
  CANCELLED:         { label: "Cancelled",          className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
  CONVERTED_TO_SALE: { label: "Converted to Sale",  className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400" },
};

export default async function AccountPage() {
  const session = await getWebSession();
  if (!session) return null;

  const { data: profile } = await publicFetch<CustomerProfile>("/auth/customer/me", {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  const reservations = profile?.reservations ?? [];
  const favorites = profile?.favorites ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-[var(--section-alt)] border border-[var(--nav-border)] p-6">
        <h1 className="text-xl font-bold text-foreground">
          Welcome back, {profile?.firstName ?? session.user.email}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your property reservations and saved listings.
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold text-secondary">{reservations.length}</span>
            <span className="ml-1.5 text-muted-foreground">Reservation{reservations.length !== 1 ? "s" : ""}</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-secondary">{favorites.length}</span>
            <span className="ml-1.5 text-muted-foreground">Saved propert{favorites.length !== 1 ? "ies" : "y"}</span>
          </div>
        </div>
      </div>

      {/* Recent reservations */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-secondary" />
            <h2 className="font-semibold">Recent Reservations</h2>
          </div>
          <Link href="/account/reservations" className="flex items-center gap-1 text-sm text-secondary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {reservations.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No reservations yet</p>
            <p className="text-sm text-muted-foreground mt-1">When you reserve a property, it will appear here.</p>
            <Link
              href="/properties"
              className="inline-block mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {reservations.slice(0, 5).map((res) => {
              const style = STATUS_STYLE[res.status] ?? { label: res.status, className: "bg-gray-100 text-gray-600" };
              return (
                <div key={res.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{res.property.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {res.property.city ? `${res.property.city}, ` : ""}{res.property.state} · {res.reservationNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">Reserved {formatDate(res.reservedAt)}</p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved properties */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-secondary" />
            <h2 className="font-semibold">Saved Properties</h2>
          </div>
          <Link href="/account/favorites" className="flex items-center gap-1 text-sm text-secondary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {favorites.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No saved properties</p>
            <p className="text-sm text-muted-foreground mt-1">Save properties you&apos;re interested in to compare later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            {favorites.slice(0, 4).map((fav) => {
              const cover = fav.property.media[0];
              return (
                <Link
                  key={fav.id}
                  href={`/properties/${fav.property.id}`}
                  className="flex gap-3 rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(cover.url)} alt={fav.property.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{fav.property.title}</p>
                    <p className="text-xs text-muted-foreground">{fav.property.city ? `${fav.property.city}, ` : ""}{fav.property.state}</p>
                    {fav.property.listingPrice && (
                      <p className="text-sm font-semibold text-secondary mt-1">{formatCurrency(fav.property.listingPrice)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
