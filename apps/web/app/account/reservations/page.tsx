import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";
import { getWebSession } from "@/lib/auth";
import { publicFetch } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Reservation {
  id: string;
  reservationNumber: string;
  status: string;
  reservationAmount: string;
  reservedAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  property: {
    id: string;
    title: string;
    state: string;
    city: string | null;
    listingPrice: string | null;
    category: string;
  };
}

const STATUS_STYLE: Record<string, { label: string; className: string; description: string }> = {
  PENDING: {
    label: "Pending Review",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    description: "Our team is reviewing your request and will contact you shortly.",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    description: "Your reservation has been confirmed. Our team will be in touch.",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
    description: "This reservation has expired. You may submit a new request.",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    description: "This reservation has been cancelled.",
  },
  CONVERTED_TO_SALE: {
    label: "Converted to Sale",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    description: "This reservation has progressed to a sale. Contact us for details.",
  },
};

const CATEGORY_LABEL: Record<string, string> = {
  LAND: "Land", HOUSE: "House", DUPLEX: "Duplex", BUNGALOW: "Bungalow",
  APARTMENT: "Apartment", COMMERCIAL: "Commercial", WAREHOUSE: "Warehouse",
  OFFICE: "Office", SHOP: "Shop", HOTEL: "Hotel", ESTATE_PLOT: "Estate Plot",
  FARM_LAND: "Farm Land", MIXED_USE: "Mixed Use", INDUSTRIAL: "Industrial",
  LUXURY_HOME: "Luxury Home", PROJECT_DEVELOPMENT: "Project Development",
};

export default async function MyReservationsPage() {
  const session = await getWebSession();
  if (!session) return null;

  const { data: reservations } = await publicFetch<Reservation[]>("/reservations/mine", {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  const items = reservations ?? [];
  const activeCount = items.filter((r) => ["PENDING", "CONFIRMED"].includes(r.status)).length;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/[0.06] bg-white/80 px-6 py-5 shadow-sm shadow-black/[0.03] backdrop-blur">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
          My Reservations
        </h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {items.length} total · {activeCount} active
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-black/[0.06] bg-white/80 p-12 text-center shadow-sm backdrop-blur">
          <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-700">No reservations yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
            Find a property you love and click &quot;Reserve this property&quot; to get started.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#A0111C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B41523]"
          >
            Browse properties <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((res) => {
            const style = STATUS_STYLE[res.status] ?? {
              label: res.status,
              className: "bg-gray-100 text-gray-600",
              description: "",
            };
            return (
              <div key={res.id} className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white/80 shadow-sm shadow-black/[0.03] backdrop-blur">
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
                        {style.label}
                      </span>
                      <span className="font-mono text-xs text-gray-400">{res.reservationNumber}</span>
                    </div>
                    <Link
                      href={`/properties/${res.property.id}`}
                      className="block truncate font-semibold text-gray-900 transition-colors hover:text-[#A0111C]"
                    >
                      {res.property.title}
                    </Link>
                    <p className="text-sm text-gray-400">
                      {CATEGORY_LABEL[res.property.category] ?? res.property.category} ·{" "}
                      {res.property.city ? `${res.property.city}, ` : ""}{res.property.state}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {res.property.listingPrice && (
                      <p className="font-bold text-[#A0111C]">{formatCurrency(res.property.listingPrice)}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">Listing price</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-black/[0.05] bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
                  <span>Reserved {formatDate(res.reservedAt)}</span>
                  {res.confirmedAt && <span>Confirmed {formatDate(res.confirmedAt)}</span>}
                  {res.status === "PENDING" && <span>Expires {formatDate(res.expiresAt)}</span>}
                  {Number(res.reservationAmount) > 0 && (
                    <span>Reservation fee: {formatCurrency(res.reservationAmount)}</span>
                  )}
                </div>

                {style.description && (
                  <div className="border-t border-black/[0.05] px-5 py-2.5">
                    <p className="text-xs text-gray-500">{style.description}</p>
                    {res.notes && (
                      <p className="mt-1 text-xs font-medium text-gray-700">Note: {res.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
