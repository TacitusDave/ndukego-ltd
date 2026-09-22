"use client";

import Link from "next/link";
import { ArrowRight, Building2, Trees } from "lucide-react";
import { motion } from "framer-motion";
import { PropertyCard, type PropertyCardData } from "@/components/property-card";
import { EstateCard, type EstateCardData } from "@/components/estate-card";

/* ────────────────────────── Section ────────────────────────── */

interface HomeFeaturedProps {
  properties: PropertyCardData[];
  estates: EstateCardData[];
}

/**
 * Merged "Featured" section: Properties on the left, Estates on the right.
 * Uses the same shared cards as the properties page — each card spans its
 * full column width so nothing is cramped.
 */
export function HomeFeatured({ properties, estates }: HomeFeaturedProps) {
  const hasProperties = properties.length > 0;
  const hasEstates = estates.length > 0;

  return (
    <section className="relative py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Shared header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="flex flex-wrap items-end justify-between gap-4 mb-14"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-3">
              Featured
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Handpicked properties &amp; estates
            </h2>
          </div>
          <Link
            href="/properties"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#A0111C] hover:text-[#B41523] transition-colors"
          >
            View all properties <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Two columns — properties left, estates right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-16">

          {/* LEFT — properties */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A0111C]/10">
                <Building2 className="h-4 w-4 text-[#A0111C]" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Properties</h3>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            {hasProperties ? (
              properties.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                >
                  <PropertyCard property={p} />
                </motion.div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-12 text-center">
                <Building2 className="h-9 w-9 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-600 text-sm">Listings coming soon</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  We&apos;re adding new verified properties. Check back shortly.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — estates */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10">
                <Trees className="h-4 w-4 text-emerald-600" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Estates</h3>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            {hasEstates ? (
              estates.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                >
                  <EstateCard estate={e} />
                </motion.div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-12 text-center">
                <Trees className="h-9 w-9 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-600 text-sm">Estates coming soon</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  New planned communities are on the way.
                </p>
              </div>
            )}

            <Link
              href="/estates"
              className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#A0111C]/25 bg-[#A0111C]/[0.03] px-5 py-4 text-sm font-semibold text-[#A0111C] hover:bg-[#A0111C]/[0.07] hover:border-[#A0111C]/40 transition-all duration-200"
            >
              View all estates
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
