import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Headset,
  Package,
  Plane,
  ScanBarcode,
  ShieldCheck,
  Ship,
  Route as RouteIcon,
  Wallet,
  Search,
  PhoneCall,
  MapPin,
  Clock,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import portImg from "@/assets/port.jpg";
import { waLink, formatRupiah } from "@/lib/site";
import { useCMS } from "@/lib/cms-context";
import { type AppCMSData } from "@/lib/cms-types";

export const Route = createFileRoute("/")({
  component: IndexRouteComponent,
  head: () => ({
    meta: [
      { title: "Jastip Anggun Jaya — Jasa Titip & Pengiriman Paket ke Papua" },
      {
        name: "description",
        content:
          "Layanan jastip & pengiriman paket, barang, dan kendaraan dari Jakarta, Surabaya, Makassar ke Manokwari, Papua. Lacak paket dengan nama & no resi.",
      },
      { property: "og:title", content: "Jastip Anggun Jaya — Pengiriman Paket ke Papua" },
      {
        property: "og:description",
        content:
          "Jastip Hemat, Pesawat, Kargo & Pelni — Jakarta, Surabaya, Makassar → Manokwari. Lacak paket Anda langsung dari website.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SERVICE_ICONS = [Package, Plane, Boxes, Ship] as const;

const FEATURE_ICON_MAP = {
  ShieldCheck,
  Wallet,
  ScanBarcode,
  Headset,
};

export function HomePageView({ previewData }: { previewData?: AppCMSData }) {
  const { data } = useCMS();
  const cms = previewData || data;
  const site = cms.site;
  const home = cms.home;
  const services = cms.services;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={home.heroImage || heroImg}
          alt="Paket dan kontainer pengiriman ke Papua"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center px-4 py-20 sm:min-h-[640px]">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-background/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground ring-1 ring-gold/50 backdrop-blur-sm">
            <RouteIcon className="size-3.5 text-gold-deep" />
            {home.hero.badge || site.cities}
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {home.hero.titlePrefix}{" "}
            <span className="text-gradient-gold">{home.hero.titleHighlight}</span>{" "}
            {home.hero.titleSuffix}
          </h1>
          <p className="mt-5 w-fit max-w-xl rounded-2xl bg-background/85 px-5 py-4 text-base font-semibold leading-relaxed text-foreground shadow-elegant backdrop-blur-md sm:text-lg">
            {home.hero.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/lacak"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background shadow-elegant transition-transform hover:scale-[1.03]"
            >
              <Search className="size-4" />
              {home.hero.trackButtonText || "Lacak Paket Saya"}
            </Link>
            <a
              href={waLink(site.waMessage, site.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/80 px-6 py-3.5 text-sm font-bold text-foreground shadow-elegant backdrop-blur-sm transition-colors hover:text-primary-deep"
            >
              <PhoneCall className="size-4" />
              {home.hero.contactButtonText || "Hubungi Admin"}
            </a>
          </div>
          <div className="mt-12 w-fit flex-wrap gap-6 rounded-2xl bg-background/85 px-5 py-4 text-sm font-semibold text-foreground shadow-elegant backdrop-blur-md sm:flex">
            {home.hero.stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-gold-deep">{stat.number}</span>
                <span className="max-w-[100px] leading-tight">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAYANAN */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gold-deep">Layanan Kami</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pilih layanan yang pas untuk paket Anda
          </h2>
          <div className="gold-rule mx-auto mt-5 w-20" />
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => {
            const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length] ?? Package;
            return (
              <Link
                key={service.id}
                to="/layanan"
                hash={service.id}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/60 hover:shadow-elegant"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{service.name}</h3>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{service.route}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.tagline}
                </p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">Mulai dari</p>
                  <p className="text-lg font-extrabold text-primary">
                    {formatRupiah(service.startingFrom)}
                    <span className="text-xs font-semibold text-muted-foreground">
                      {" "}
                      /{service.unit}
                    </span>
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-gold-deep group-hover:underline">
                    Lihat tarif <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CARA KERJA */}
      <section className="bg-secondary/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gold-deep">Cara Kerja</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Kirim paket hanya 3 langkah
            </h2>
            <div className="gold-rule mx-auto mt-5 w-20" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {home.steps.map((step) => (
              <div key={step.no} className="relative rounded-2xl border border-border bg-card p-7">
                <span className="text-4xl font-extrabold text-gradient-gold">{step.no}</span>
                <h3 className="mt-3 text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gold-deep">Kenapa Kami</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Titip tenang, sampai dengan aman
          </h2>
          <div className="gold-rule mx-auto mt-5 w-20" />
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {home.features.map((f) => {
            const Icon = FEATURE_ICON_MAP[f.iconName] || ShieldCheck;
            return (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-extrabold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* JANGKAUAN */}
      <section className="relative overflow-hidden">
        <img
          src={home.portImage || portImg}
          alt="Kapal kargo tiba di pelabuhan Papua"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/80 to-primary-deep/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest text-gold">
              Jangkauan Kiriman
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Dari kota besar Jawa & Sulawesi, langsung ke Manokwari
            </h2>
            <div className="mt-8 space-y-3">
              {(home.citiesReach || ["Jakarta", "Surabaya", "Makassar"]).map((city) => (
                <div
                  key={city}
                  className="flex items-center justify-between rounded-xl bg-background/10 px-5 py-3.5 backdrop-blur-sm ring-1 ring-primary-foreground/15"
                >
                  <span className="font-bold text-primary-foreground">{city}</span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
                    → Manokwari
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA LACAK */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-red px-6 py-14 text-center shadow-elegant sm:px-14">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-gold/20 blur-2xl" />
          <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-background/10 blur-2xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              {home.cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              {home.cta.text}
            </p>
            <Link
              to="/lacak"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-7 py-3.5 text-sm font-bold text-foreground shadow-gold transition-transform hover:scale-[1.03]"
            >
              <Search className="size-4" />
              {home.cta.buttonText || "Lacak Paket Sekarang"}
            </Link>
          </div>
        </div>
      </section>

      {/* KONTAK SINGKAT */}
      <section className="border-t border-border bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-elegant">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="font-extrabold">Alamat Gudang</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{site.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-elegant">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="font-extrabold">Jam Layanan</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{site.hours}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-elegant">
              <PhoneCall className="size-5" />
            </span>
            <div>
              <p className="font-extrabold">Hubungi Admin</p>
              <a
                href={waLink(site.waMessage, site.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                <PhoneCall className="size-4" />
                Chat WhatsApp Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function IndexRouteComponent() {
  return <HomePageView />;
}
