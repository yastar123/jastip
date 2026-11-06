import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Clock, PhoneCall, Cloud, Search } from "lucide-react";
import { waLink } from "@/lib/site";
import { useCMS } from "@/lib/cms-context";
import { type AppCMSData } from "@/lib/cms-types";

export const Route = createFileRoute("/kontak")({
  component: KontakRouteComponent,
  head: () => ({
    meta: [
      { title: "Kontak — Jastip Anggun Jaya" },
      {
        name: "description",
        content:
          "Alamat gudang, jam layanan, dan kontak admin Jastip Anggun Jaya di Manokwari, Papua. Hubungi admin melalui WhatsApp.",
      },
      { property: "og:title", content: "Kontak — Jastip Anggun Jaya" },
      {
        property: "og:description",
        content:
          "Hubungi admin Jastip Anggun Jaya — gudang di Jln. Merpati SP 4, Manokwari. Chat WhatsApp untuk tanya tarif & paket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

export function KontakPageView({ previewData }: { previewData?: AppCMSData }) {
  const { data } = useCMS();
  const cms = previewData || data;
  const site = cms.site;
  const kp = cms.kontakPage || {
    headerBadge: "Kontak",
    headerTitle: "Kami siap membantu Anda",
    headerDescription:
      "Tanya tarif, jadwal keberangkatan, atau kondisi paket — admin kami membalas dengan cepat melalui WhatsApp.",
    warehouseCardTitle: "Alamat Gudang",
    hoursCardTitle: "Jam Layanan",
    waCardTitle: "WhatsApp Admin",
    waCardDesc: "Klik tombol di bawah untuk chat langsung dengan admin kami.",
    infoBox1Title: "Data Paket Dikelola Admin",
    infoBox1Text:
      "Data paket dan status pengiriman saat ini dikelola langsung oleh admin dan diperbarui berkala melalui Dashboard, sehingga hasil pelacakan di website selalu sesuai catatan resmi.",
    infoBox2Title: "Sudah punya nomor resi?",
    infoBox2Text:
      "Cek status dan ongkir paket Anda sendiri — cukup nama dan nomor resi, tanpa perlu menghubungi admin.",
    infoBox2ButtonText: "Lacak Paket Sekarang",
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-red">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">{kp.headerBadge}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            {kp.headerTitle}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            {kp.headerDescription}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            {kp.warehouseImage && (
              <div className="h-44 w-full overflow-hidden border-b border-border bg-muted">
                <img
                  src={kp.warehouseImage}
                  alt={kp.warehouseCardTitle}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-7">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <MapPin className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-extrabold">{kp.warehouseCardTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{site.address}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-elegant">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Clock className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">{kp.hoursCardTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{site.hours}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-elegant">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <PhoneCall className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">{kp.waCardTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nomor: <span className="font-bold text-foreground">+{site.whatsapp}</span>
              <br />
              {kp.waCardDesc}
            </p>
            <a
              href={waLink(site.waMessage, site.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary-deep"
            >
              <PhoneCall className="size-4" />
              Hubungi Admin
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-gradient-red p-8 text-primary-foreground shadow-elegant">
            <Cloud className="size-8 text-gold" />
            <h2 className="mt-4 text-xl font-extrabold">{kp.infoBox1Title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
              {kp.infoBox1Text}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-8">
            <Search className="size-8 text-gold-deep" />
            <h2 className="mt-4 text-xl font-extrabold">{kp.infoBox2Title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{kp.infoBox2Text}</p>
            <Link
              to="/lacak"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-bold text-foreground shadow-gold transition-transform hover:scale-[1.03]"
            >
              <Search className="size-4" />
              {kp.infoBox2ButtonText || "Lacak Paket Sekarang"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function KontakRouteComponent() {
  return <KontakPageView />;
}
