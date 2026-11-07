import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Package, Plane, Ship, Info, PhoneCall, Search, BadgeCheck } from "lucide-react";
import { waLink, formatRupiah } from "@/lib/site";
import { useCMS } from "@/lib/cms-context";
import { type AppCMSData } from "@/lib/cms-types";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/layanan")({
  component: LayananRouteComponent,
  head: () => ({
    meta: [
      { title: "Layanan & Tarif — Jastip Anggun Jaya" },
      {
        name: "description",
        content:
          "Daftar lengkap layanan dan tarif Jastip Anggun Jaya: Jastip Hemat, Jastip Pesawat, Jastip Kargo, dan Jastip Pelni ke Manokwari, Papua.",
      },
      { property: "og:title", content: "Layanan & Tarif — Jastip Anggun Jaya" },
      {
        property: "og:description",
        content:
          "Jastip Hemat, Pesawat, Kargo & Pelni — daftar tarif lengkap dari Jakarta, Surabaya, dan Makassar ke Manokwari.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/layanan` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Layanan & Tarif — Jastip Anggun Jaya" },
      {
        name: "twitter:description",
        content:
          "Jastip Hemat, Pesawat, Kargo & Pelni — daftar tarif lengkap dari Jakarta, Surabaya, dan Makassar ke Manokwari.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/layanan` }],
  }),
});

const SERVICE_ICONS: Record<string, typeof Package> = {
  hemat: Package,
  pesawat: Plane,
  kargo: Boxes,
  pelni: Ship,
};

function PricingTable({
  title,
  columns,
  rows,
}: {
  title?: string | undefined;
  columns: [string, string];
  rows: { label: string; price: number; note?: string | undefined }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {title && (
        <div className="border-b border-border bg-secondary px-5 py-3">
          <p className="text-sm font-extrabold text-primary-deep">{title}</p>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-red text-left text-primary-foreground">
            <th className="px-5 py-3 font-bold">{columns[0]}</th>
            <th className="px-5 py-3 text-right font-bold">{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-accent/40"}>
              <td className="px-5 py-3">
                <p className="font-semibold">{row.label}</p>
                {row.note && <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>}
              </td>
              <td className="px-5 py-3 text-right font-extrabold text-primary">
                {formatRupiah(row.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LayananPageView({ previewData }: { previewData?: AppCMSData }) {
  const { data } = useCMS();
  const cms = previewData || data;
  const services = cms.services || [];
  const site = cms.site;
  const lp = cms.layananPage || {
    headerBadge: "Layanan & Tarif",
    headerTitle: `${services.length} pilihan layanan ke Manokwari`,
    headerDescription:
      "Semua tarif di bawah ini transparan dan resmi — pilih sesuai kebutuhan kecepatan, berat, dan volume paket Anda.",
    ctaTitle: "Belum yakin pilih yang mana?",
    ctaDescription:
      "Konsultasikan kebutuhan pengiriman Anda dengan admin — kami bantu pilihkan layanan yang paling hemat dan cepat.",
    ctaButtonText: "Hubungi Admin",
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Layanan dan Tarif Jastip Anggun Jaya",
            itemListElement: services.map((service, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Service",
                name: service.name,
                description: service.tagline,
                areaServed: service.route,
                provider: {
                  "@type": "Organization",
                  name: cms.site.name,
                  url: SITE_URL,
                },
              },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      {/* Header halaman */}
      <section className="relative overflow-hidden bg-gradient-red">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">{lp.headerBadge}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            {lp.headerTitle}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            {lp.headerDescription}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {services.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full bg-background/15 px-4 py-2 text-xs font-bold text-primary-foreground ring-1 ring-primary-foreground/25 backdrop-blur-sm transition-colors hover:bg-gold hover:text-foreground"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="space-y-14">
          {services.map((service) => {
            const Icon = SERVICE_ICONS[service.id] ?? Package;
            return (
              <section key={service.id} id={service.id} className="scroll-mt-28">
                <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant sm:p-9">
                  {service.image && (
                    <div className="mb-6 -mx-6 -mt-6 sm:-mx-9 sm:-mt-9 h-48 sm:h-56 w-[calc(100%+3rem)] sm:w-[calc(100%+4.5rem)] overflow-hidden border-b border-border bg-muted">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-red text-primary-foreground shadow-elegant">
                        <Icon className="size-7" />
                      </span>
                      <div>
                        <h2 className="text-2xl font-extrabold tracking-tight">{service.name}</h2>
                        <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                          {service.route}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.options.map((opt) => (
                        <span
                          key={opt}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-xs font-bold text-accent-foreground"
                        >
                          <BadgeCheck className="size-3.5" />
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {service.tagline}
                  </p>

                  <div
                    className={
                      "mt-6 grid gap-4 " +
                      (service.tables.length > 1 ? "lg:grid-cols-2" : "max-w-xl")
                    }
                  >
                    {service.tables.map((table, tIdx) => (
                      <PricingTable
                        key={table.title ?? `${service.id}-${tIdx}`}
                        title={table.title}
                        columns={table.columns}
                        rows={table.rows}
                      />
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {service.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground"
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {service.notes.length > 0 && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-accent/60 px-5 py-4">
                      <Info className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                      <div className="text-sm text-accent-foreground">
                        {service.notes.map((note) => (
                          <p key={note}>{note}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground">
                      Mulai dari{" "}
                      <span className="text-lg font-extrabold text-primary">
                        {formatRupiah(service.startingFrom)}
                      </span>
                      <span className="text-muted-foreground"> /{service.unit}</span>
                    </p>
                    <div className="ml-auto flex flex-wrap gap-2.5">
                      <a
                        href={waLink(
                          `Halo Admin Jastip Anggun Jaya, saya ingin bertanya tentang ${service.name} (${service.route}).`,
                          site.whatsapp,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-deep"
                      >
                        <PhoneCall className="size-4" />
                        Tanya layanan ini
                      </a>
                      <Link
                        to="/lacak"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
                      >
                        <Search className="size-4" />
                        Lacak paket
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl bg-secondary/60 px-6 py-10 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">{lp.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {lp.ctaDescription}
          </p>
          <a
            href={waLink(site.waMessage, site.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-bold text-foreground shadow-gold transition-transform hover:scale-[1.03]"
          >
            <PhoneCall className="size-4" />
            {lp.ctaButtonText || "Hubungi Admin"}
          </a>
        </div>
      </div>
    </div>
  );
}

function LayananRouteComponent() {
  return <LayananPageView />;
}
