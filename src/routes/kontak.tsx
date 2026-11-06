import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Clock, PhoneCall, Cloud, Search } from "lucide-react";
import { SITE, waLink } from "@/lib/site";

export const Route = createFileRoute("/kontak")({
  component: Kontak,
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

function Kontak() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-red">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">Kontak</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            Kami siap membantu Anda
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            Tanya tarif, jadwal keberangkatan, atau kondisi paket — admin kami
            membalas dengan cepat melalui WhatsApp.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-elegant">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <MapPin className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">Alamat Gudang</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {SITE.address}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-elegant">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Clock className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">Jam Layanan</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{SITE.hours}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-elegant">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <PhoneCall className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">WhatsApp Admin</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Klik tombol di bawah untuk chat langsung dengan admin kami.
            </p>
            <a
              href={waLink()}
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
            <h2 className="mt-4 text-xl font-extrabold">Data Paket Dikelola Admin</h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
              Data paket dan status pengiriman saat ini dikelola langsung oleh admin
              dan diperbarui berkala, sehingga hasil pelacakan di website selalu
              sesuai catatan resmi.
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-8">
            <Search className="size-8 text-gold-deep" />
            <h2 className="mt-4 text-xl font-extrabold">Sudah punya nomor resi?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Cek status dan ongkir paket Anda sendiri — cukup nama dan nomor resi,
              tanpa perlu menghubungi admin.
            </p>
            <Link
              to="/lacak"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-bold text-foreground shadow-gold transition-transform hover:scale-[1.03]"
            >
              <Search className="size-4" />
              Lacak Paket Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
