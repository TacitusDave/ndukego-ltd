import Link from "next/link";
import { CalendarCheck, Heart, ArrowRight, Building2, CircleDollarSign } from "lucide-react";
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
  createdAt: string;
  reservations: ReservationItem[];
  favorites: FavoriteItem[];
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending Review", className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20" },
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" },
  EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20" },
  CONVERTED_TO_SALE: { label: "Converted to Sale", className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-black/[0.06] bg-white/80 p-5 shadow-sm shadow-black/[0.03] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
    </Link>
  );
}

export default async function AccountPage() {
  const session = await getWebSession();
  if (!session) return null;

  const { data: profile } = await publicFetch<CustomerProfile>("/auth/customer/me", {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  const reservations = profile?.reservations ?? [];
  const favorites = profile?.favorites ?? [];
  const activeReservations = reservations.filter((r) => ["PENDING", "CONFIRMED"].includes(r.status)).length;
  const memberSince = profile?.createdAt ? formatDate(profile.createdAt) : null;

  return (
    <div className="space-y-6">
      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          label="Active reservations"
          value={activeReservations}
          href="/account/reservations"
          accent="bg-[#A0111C]/[0.08] text-[#A0111C]"
        />
        <StatCard
          icon={Heart}
          label="Saved properties"
          value={favorites.length}
          href="/account/favorites"
          accent="bg-rose-50 text-rose-600"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Total tracked"
          value={reservations.length}
          href="/account/reservations"
          accent="bg-gray-100 text-gray-700"
        />
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/properties"
          className="group flex items-center gap-4 rounded-3xl bg-gradient-to-br from-[#A0111C] to-[#7A0D15] p-6 text-white shadow-lg shadow-[#A0111C]/20 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Find your next property
            </span>
            <span className="text-sm text-white/70">Browse verified listings across Nigeria</span>
          </span>
          <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
        <Link
          href="/contact"
          className="group flex items-center gap-4 rounded-3xl border border-black/[0.06] bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A0111C]/[0.08] text-[#A0111C]">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              Book a consultation
            </span>
            <span className="text-sm text-gray-500">Speak with an agent about your goals</span>
          </span>
          <ArrowRight className="h-5 w-5 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#A0111C]" />
        </Link>
      </div>

      {/* ── Recent reservations ── */}
      <div className="rounded-3xl border border-black/[0.06] bg-white/80 shadow-sm shadow-black/[0.03] backdrop-blur">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-[#A0111C]" />
            <h2 className="font-semibold text-gray-900">Recent Reservations</h2>
          </div>
          <Link href="/account/reservations" className="flex items-center gap-1 text-sm font-medium text-[#A0111C] hover:text-[#B41523]">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {reservations.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="font-medium text-gray-700">No reservations yet</p>
            <p className="mt-1 text-sm text-gray-400">When you reserve a property, it will appear here.</p>
            <Link
              href="/properties"
              className="mt-4 inline-block rounded-full bg-[#A0111C] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B41523]"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {reservations.slice(0, 5).map((res) => {
              const style = STATUS_STYLE[res.status] ?? { label: res.status, className: "bg-gray-100 text-gray-600" };
              return (
                <div key={res.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{res.property.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {res.property.city ? `${res.property.city}, ` : ""}{res.property.state} · {res.reservationNumber}
                    </p>
                    <p className="text-xs text-gray-400">Reserved {formatDate(res.reservedAt)}</p>
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

      {/* ── Saved properties ── */}
      <div className="rounded-3xl border border-black/[0.06] bg-white/80 shadow-sm shadow-black/[0.03] backdrop-blur">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#A0111C]" />
            <h2 className="font-semibold text-gray-900">Saved Properties</h2>
          </div>
          <Link href="/account/favorites" className="flex items-center gap-1 text-sm font-medium text-[#A0111C] hover:text-[#B41523]">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {favorites.length === 0 ? (
          <div className="p-10 text-center">
            <Heart className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="font-medium text-gray-700">No saved properties</p>
            <p className="mt-1 text-sm text-gray-400">Save properties you&apos;re interested in to compare later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            {favorites.slice(0, 4).map((fav) => {
              const cover = fav.property.media[0];
              return (
                <Link
                  key={fav.id}
                  href={`/properties/${fav.property.id}`}
                  className="group flex gap-3 rounded-2xl border border-black/[0.06] bg-white p-3 transition-all duration-200 hover:border-[#A0111C]/25 hover:shadow-sm"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(cover.url)} alt={fav.property.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{fav.property.title}</p>
                    <p className="text-xs text-gray-400">
                      {fav.property.city ? `${fav.property.city}, ` : ""}{fav.property.state}
                    </p>
                    {fav.property.listingPrice && (
                      <p className="mt-1 text-sm font-semibold text-[#A0111C]">{formatCurrency(fav.property.listingPrice)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {memberSince && (
        <p className="text-center text-xs text-gray-400">
          Member since {memberSince}
          {profile?.customerNumber ? ` · ${profile.customerNumber}` : ""}
        </p>
      )}
    </div>
  );
}
