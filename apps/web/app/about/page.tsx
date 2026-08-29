import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Eye, TrendingUp, MapPin, ArrowRight, CheckCircle } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.84 1.56V6.78a4.85 4.85 0 0 1-1.07-.09z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

export const metadata: Metadata = { title: { absolute: "About - Ndukego Investment & Properties Ltd" } };


const HIGHLIGHTS = [
  "Title-verified listings only",
  "Residential, commercial & land across Nigeria",
  "Dedicated estate developments",
  "Investor-focused opportunities",
  "Professional agency support",
  "Transparent pricing, always",
  "And more…",
];

// ── Team data — replace photo: null with image URL, socials: null with profile link ──

const EXECUTIVES = [
  {
    title: "President & Executive Director",
    bio: "Leading the strategic direction and growth of Ndukego Investment & Properties Ltd with over a decade of real estate expertise.",
    photo: null as string | null,
    instagram: null as string | null,
    tiktok: null as string | null,
    youtube: null as string | null,
  },
  {
    title: "Executive Director & Head of Digital Operations",
    bio: "Overseeing daily operations and the company's digital presence, ensuring every client receives the highest standard of professional service.",
    photo: "/Profile-Picture.png",
    instagram: null as string | null,
    tiktok: null as string | null,
    youtube: null as string | null,
  },
  {
    title: "Executive Director",
    bio: "Driving the company's investment financing and LPO financing divisions with rigorous financial oversight.",
    photo: null as string | null,
    instagram: null as string | null,
    tiktok: null as string | null,
    youtube: null as string | null,
  },
];

const TEAM = [
  { name: "Sales Agent", title: "Senior Sales Agent", photo: null as string | null },
  { name: "Sales Agent", title: "Sales Agent", photo: null as string | null },
  { name: "Sales Agent", title: "Sales Agent", photo: null as string | null },
  { name: "Sales Agent", title: "Sales Agent", photo: null as string | null },
];

// ── Photo placeholder — fills the top of a card like a property image ────────

function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-100 flex items-center justify-center ${className ?? ""}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-gray-300" stroke="currentColor" strokeWidth="1.2">
        <circle cx="12" cy="8" r="4.5" />
        <path d="M3 21c0-5 4-8.5 9-8.5s9 3.5 9 8.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-[var(--section-alt)] border-b border-[var(--nav-border)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              About Ndukego<br />&amp; Investment Properties Limited
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A professional real estate company connecting buyers, investors, and renters
              with verified properties, estates, and investment opportunities across Nigeria.
            </p>
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Our story</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Ndukego Investment &amp; Properties Limited was founded by Chief Okey Nduoma Okoronkwo, on a simple belief: real estate transactions in Nigeria should be as straightforward, transparent, and trustworthy as they are in any world-class market.
                </p>
                <p>
                  Over the past decade, we have helped hundreds of families find their homes, supported investors in building wealth through land and commercial acquisitions, and developed estate communities that Nigerians are proud to call home.
                </p>
                <p>
                  From our base in Abuja, we serve clients across Nigeria, offering residential
                  and commercial property sales, estate development, LPO financing, and investment consultancy, all under one roof with the professionalism our clients expect and deserve.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href={`/contact?message=${encodeURIComponent("Hi, I came across the About page and would like to speak with your team.")}`}
                  className="inline-flex items-center gap-2 rounded bg-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-secondary/90 transition-colors"
                >
                  Talk to our team <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className=" border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground mb-4">What we offer</h3>
                <ul className="space-y-2.5">
                  {HIGHLIGHTS.map((h) => (
                    <li key={h} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border bg-card p-5 text-center">
                  <p className="text-3xl font-bold text-secondary">10+</p>
                  <p className="text-xs text-muted-foreground mt-1">Years in real estate</p>
                </div>
                <div className="border border-border bg-card p-5 text-center">
                  <p className="text-3xl font-bold text-secondary">12</p>
                  <p className="text-xs text-muted-foreground mt-1">States covered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission / Vision ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border bg-card p-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">Mission</h3>
              <p className="text-foreground leading-relaxed">
                To connect every Nigerian homebuyer, investor, or renter with trusted,
                verified real estate and investment opportunities through transparent, professional service.
              </p>
            </div>
            <div className="border border-border bg-card p-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">Vision</h3>
              <p className="text-foreground leading-relaxed">
                To be Nigeria&apos;s most trusted real estate and investment company, where every transaction is conducted with integrity, clarity, and professional excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Executives & Directors ── */}
      <section className="py-16 bg-[var(--section-alt)] border-t border-[var(--nav-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground tracking-widest uppercase">Leadership</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              The executives and directors driving Ndukego Investment &amp; Properties Limited forward.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {EXECUTIVES.map((person, i) => (
              <div key={i} className="relative flex flex-col">
                <div className="relative z-10 -mb-8 mx-auto w-[82%] max-w-[220px] shadow-[0_18px_30px_rgba(15,23,42,0.12)]">
                  {person.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={person.photo}
                      alt={person.title}
                      className="aspect-[3.8/5] w-full rounded-[1.35rem] object-cover object-center bg-transparent"
                      style={{ objectPosition: 'center 18%' }}
                    />
                  ) : (
                    <div className="aspect-[3.8/5] w-full overflow-hidden rounded-[1.35rem] bg-transparent">
                      <PhotoPlaceholder className="h-full w-full" />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card px-4 pt-12 pb-4 flex flex-col flex-1">
                  {/* Red title only — no duplicate black name */}
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondary"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {person.title}
                  </p>

                  {/* Thin accent rule under title */}
                  <div className="w-8 h-[2px] bg-secondary/40 rounded-full mt-1.5 mb-2.5" />

                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{person.bio}</p>

                  {/* Social icons — shown if at least one link is set */}
                  {(person.instagram || person.tiktok || person.youtube) && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {person.instagram && (
                        <a
                          href={person.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram"
                          className="flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-colors"
                        >
                          <InstagramIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {person.tiktok && (
                        <a
                          href={person.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="TikTok"
                          className="flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-colors"
                        >
                          <TikTokIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {person.youtube && (
                        <a
                          href={person.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="YouTube"
                          className="flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-colors"
                        >
                          <YouTubeIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team / Sales Agents ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">
              <span className="lowercase font-normal">the </span><span className="uppercase text-secondary tracking-widest">Team</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              The agents and professionals who serve our clients every day.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {TEAM.map((person, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-sm">
                <div className="relative aspect-[3.8/5] w-full overflow-hidden bg-muted">
                  {person.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-[1.02]"
                    />
                  ) : (
                    <PhotoPlaceholder className="h-full w-full" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-foreground text-sm leading-tight">{person.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{person.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-[var(--section-alt)] border-t border-[var(--nav-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to work with us?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Whether you are buying, investing, or looking for financing — our team is here to guide you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded bg-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-secondary/90 transition-colors"
            >
              Browse properties <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
