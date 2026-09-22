import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, ExternalLink } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { AnimateIn } from "@/components/animate-in";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Ndukego Investment & Properties Ltd — call, email, or visit our Abuja office.",
};

const CONTACT_DETAILS = [
  {
    icon: Phone,
    label: "Call us",
    items: [
      { text: "+234 803 609 6700", href: "tel:+2348036096700" },
      { text: "+234 705 295 5555", href: "tel:+2347052955555" },
    ],
  },
  {
    icon: Mail,
    label: "Email us",
    items: [
      {
        text: "ndukegoinvest.propertiesltd@gmail.com",
        href: "mailto:ndukegoinvest.propertiesltd@gmail.com",
      },
    ],
  },
  {
    icon: MapPin,
    label: "Our office",
    items: [
      {
        text: "758 Independence Ave, Central Business District, Abuja, FCT",
        href: "https://maps.google.com/?q=9.0526716,7.4819368",
      },
    ],
  },
];

const MAP_EMBED =
  "https://maps.google.com/maps?q=9.0526716,7.4819368&hl=en&z=17&output=embed";

const MAPS_LINK =
  "https://www.google.com/maps/place/758+Independence+Ave,+Central+Business+Dis,+Abuja+900103,+Federal+Capital+Territory/@9.0526716,7.4812931,19z";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const defaultMessage = params.message ? decodeURIComponent(params.message) : undefined;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative py-20 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0111C] mb-4">
              Contact
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Let&apos;s talk.
            </h1>
            <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
              Whether you&apos;re buying, investing, or just exploring, our team
              is ready to help you make the right move.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Main grid ── */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* ── Left: contact info + map ── */}
            <AnimateIn>
              <div className="space-y-8">
                <div className="space-y-5">
                  {CONTACT_DETAILS.map(({ icon: Icon, label, items }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[#A0111C]/8 border border-[#A0111C]/15">
                        <Icon className="h-4 w-4 text-[#A0111C]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                          {label}
                        </p>
                        {items.map((item) =>
                          item.href ? (
                            <a
                              key={item.text}
                              href={item.href}
                              target={item.href.startsWith("http") ? "_blank" : undefined}
                              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="block text-sm text-gray-700 hover:text-[#A0111C] transition-colors leading-snug"
                            >
                              {item.text}
                            </a>
                          ) : (
                            <p key={item.text} className="text-sm text-gray-500 leading-snug">
                              {item.text}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Interactive Map ── */}
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="relative">
                    <iframe
                      src={MAP_EMBED}
                      width="100%"
                      height="320"
                      style={{ border: 0, display: "block" }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ndukego Investment & Properties — Office Location"
                    />
                  </div>
                  <a
                    href={MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-gray-500 hover:text-[#A0111C] bg-white border-t border-gray-100 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Google Maps · Get directions
                  </a>
                </div>
              </div>
            </AnimateIn>

            {/* ── Right: inquiry form ── */}
            <AnimateIn delay={0.1}>
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-8 shadow-sm">
                <h2
                  className="text-xl font-bold text-gray-900 mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Send us a message
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                  Fill in the form below and we&apos;ll get back to you within one business day.
                </p>
                <InquiryForm defaultMessage={defaultMessage} />
              </div>
            </AnimateIn>

          </div>
        </div>
      </section>
    </>
  );
}
