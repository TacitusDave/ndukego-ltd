import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { LogoIcon } from "@nhgp/assets";
import { DynamicYear } from "./dynamic-year";

/* ── Social media icons ────────────────────────────────── */

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterXIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
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

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/ndukego.ltd", Icon: InstagramIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "YouTube", href: "#", Icon: YouTubeIcon },
];

const SERVICES = [
  { label: "Real Estate", href: "/services/real-estate" },
  { label: "LPO Financing", href: "/services/lpo-financing" },
  { label: "Investment Financing", href: "/services/investment-financing" },
  { label: "Investment Consultancy", href: "/services/investment-consultancy" },
];

const EXPLORE = [
  { label: "All Properties", href: "/properties" },
  { label: "Our Estates", href: "/services/real-estate" },
  { label: "Gallery", href: "/gallery" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/insights" },
];

const COMPANY = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer>
      {/* ── Main section ── */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Brand column — 5 of 12 */}
            <div className="lg:col-span-5 space-y-6">
              {/* Logo: large icon on its own (no red background), beside company name */}
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <LogoIcon width={64} height={64} />
                </div>
                <div className="pt-1">
                  <p
                    className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Ndukego Investment<br />
                    &amp; Properties Ltd
                  </p>
                  {/* Registered company identifier */}
                  <p className="mt-1 text-xs font-medium tracking-wide text-gray-400">
                    RC 1164064
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                Nigeria&apos;s trusted partner for real estate, financing, and investment
                opportunities — built on transparency, professionalism, and lasting results.
              </p>

              {/* Contact details */}
              <div className="space-y-2.5">
                <a
                  href="tel:+2348036096700"
                  className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-[#A0111C] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#A0111C] shrink-0" />
                  +234 803 609 6700
                </a>
                <a
                  href="tel:+2347052955555"
                  className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-[#A0111C] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#A0111C] shrink-0" />
                  +234 705 295 5555
                </a>
                <a
                  href="mailto:ndukegoinvest.propertiesltd@gmail.com"
                  className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-[#A0111C] transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-[#A0111C] shrink-0" />
                  ndukegoinvest.propertiesltd@gmail.com
                </a>
                <a
                  href="https://www.google.com/maps/place/758+Independence+Ave,+Central+Business+Dis,+Abuja+900103,+Federal+Capital+Territory/@9.0526716,7.4812931,19z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-[#A0111C] transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#A0111C] shrink-0" />
                  Locate Us
                </a>
              </div>

              {/* Social icons */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Follow Us
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {SOCIALS.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      title={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:border-[#A0111C]/30 hover:bg-[#A0111C]/5 hover:text-[#A0111C] transition-all duration-200"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Links — 7 of 12 */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Services */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Services
                  </h4>
                  <ul className="space-y-2.5">
                    {SERVICES.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className="text-sm text-gray-600 hover:text-[#A0111C] transition-colors">
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Explore — properties, estates (inside Real Estate), gallery, projects */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Explore
                  </h4>
                  <ul className="space-y-2.5">
                    {EXPLORE.map((p) => (
                      <li key={p.label}>
                        <Link href={p.href} className="text-sm text-gray-600 hover:text-[#A0111C] transition-colors">
                          {p.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Company */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Company
                  </h4>
                  <ul className="space-y-2.5">
                    {COMPANY.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="text-sm text-gray-600 hover:text-[#A0111C] transition-colors">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contact Us CTA — sits at the bottom of the links area */}
              <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-400">Available Mon–Fri, 8 am – 6 pm WAT</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded bg-[#A0111C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#B41523] transition-colors shadow-sm shadow-[#A0111C]/15"
                >
                  Contact Us <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="bg-gray-900 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © <DynamicYear /> Ndukego Investment &amp; Properties Limited (RC 1164064). All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
