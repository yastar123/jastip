import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  ScanBarcode,
  PackageCheck,
  Truck,
  Clock,
  CircleAlert,
  CircleCheck,
  MapPin,
  FileSpreadsheet,
  Cloud,
} from "lucide-react";
import { findShipment, DEMO_SHIPMENTS, type Shipment } from "@/lib/tracking";
import { formatRupiah } from "@/lib/site";

export const Route = createFileRoute("/lacak")({
  component: Lacak,
  head: () => ({
    meta: [
      { title: "Lacak Paket — Jastip Anggun Jaya" },
      {
        name: "description",
        content:
          "Cek status dan ongkir paket Jastip Anggun Jaya cukup dengan nama dan nomor resi. Cepat, mudah, tanpa perlu telepon.",
      },
      { property: "og:title", content: "Lacak Paket — Jastip Anggun Jaya" },
      {
        property: "og:description",
        content:
          "Masukkan nama dan nomor resi untuk melihat status perjalanan dan ongkir paket Anda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const STAGE_META = {
  diterima: { label: "Baru Diterima", cls: "bg-muted text-muted-foreground", icon: ScanBarcode },
  perjalanan: { label: "Dalam Perjalanan", cls: "bg-secondary text-primary-deep", icon: Truck },
  tiba: { label: "Siap Diambil", cls: "bg-accent text-accent-foreground", icon: PackageCheck },
} as const;

function Lacak() {
  const [resi, setResi] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!resi.trim() || !name.trim()) {
      setResult(null);
      setError("Nama dan nomor resi keduanya wajib diisi.");
      return;
    }
    const found = findShipment(resi, name);
    if (!found) {
      setResult(null);
      setError(
        "Paket tidak ditemukan. Periksa kembali nama dan nomor resi Anda, atau hubungi admin.",
      );
      return;
    }
    setError(null);
    setResult(found);
  };

  const fillDemo = (demo: Shipment) => {
    setResi(demo.resi);
    setName(demo.name);
    setError(null);
    setResult(demo);
  };

  return (
    <div>
      {/* Header halaman */}
      <section className="relative overflow-hidden bg-gradient-red">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">Lacak Paket</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            Cek posisi paket Anda di sini
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            Masukkan <strong>nama</strong> dan <strong>nomor resi</strong> yang Anda
            terima saat titip paket. Pengecekan hanya bisa dilakukan dengan nama dan
            no resi — nomor HP tidak dapat digunakan.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* FORM */}
          <div className="space-y-5">
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-border bg-card p-6 shadow-elegant sm:p-7"
            >
              <h2 className="text-lg font-extrabold">Data Pelacakan</h2>
              <div className="gold-rule mt-3 w-14" />
              <label className="mt-6 block">
                <span className="text-sm font-bold">Nama Penerima / Pengirim</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="mt-4 block">
                <span className="text-sm font-bold">Nomor Resi</span>
                <input
                  value={resi}
                  onChange={(e) => setResi(e.target.value)}
                  placeholder="Contoh: AJH-1024"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm uppercase outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary-deep"
              >
                <Search className="size-4" />
                Cek Status Paket
              </button>
              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-accent/50 px-4 py-3.5 text-xs leading-relaxed text-accent-foreground">
                <CircleCheck className="mt-0.5 size-4 shrink-0" />
                <span>
                  Lacak paket hanya dengan <strong>nama + no resi</strong>. Hasil
                  berupa <strong>data harga (ongkir)</strong> dan{" "}
                  <strong>status paket</strong> — pembuatan/unduh invoice tidak
                  tersedia untuk konsumen.
                </span>
              </div>
            </form>

            <div className="rounded-3xl border border-border bg-card p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <Cloud className="size-4 text-gold-deep" />
                <h3 className="text-sm font-extrabold">Coba Data Demo</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Klik salah satu contoh di bawah untuk mencoba pelacakan. Data asli
                dikelola admin dan diperbarui berkala.
              </p>
              <ul className="mt-4 space-y-2">
                {DEMO_SHIPMENTS.map((demo) => (
                  <li key={demo.resi}>
                    <button
                      type="button"
                      onClick={() => fillDemo(demo)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-gold/60 hover:bg-accent/40"
                    >
                      <span className="block text-xs font-extrabold uppercase tracking-wide text-primary">
                        {demo.resi}
                      </span>
                      <span className="text-xs text-muted-foreground">{demo.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* HASIL */}
          <div>
            {result ? (
              <div className="rounded-3xl border border-border bg-card shadow-elegant">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/50 px-6 py-5 sm:px-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nomor Resi
                    </p>
                    <p className="text-xl font-extrabold tracking-wide text-primary sm:text-2xl">
                      {result.resi}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                      {result.name}
                    </p>
                  </div>
                  {(() => {
                    const meta = STAGE_META[result.stage];
                    const Icon = meta.icon;
                    return (
                      <span
                        className={
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold " +
                          meta.cls
                        }
                      >
                        <Icon className="size-4" />
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
                  <Detail label="Layanan" value={result.service} />
                  <Detail label="Rute" value={result.route} />
                  <Detail label="Berat / Volume" value={result.weight} />
                  <Detail label="Status" value={result.status} />
                  <Detail label="Terakhir Diperbarui" value={result.updated} icon={Clock} />
                  <div className="rounded-2xl bg-gradient-red px-5 py-4 text-primary-foreground shadow-elegant">
                    <p className="text-xs font-bold uppercase tracking-wider text-gold">
                      Data Harga (Ongkir)
                    </p>
                    <p className="mt-1 text-2xl font-extrabold">
                      {formatRupiah(result.price)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border px-6 py-6 sm:px-8">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Riwayat Perjalanan
                  </h3>
                  <ol className="mt-5 space-y-0">
                    {result.timeline.map((event, i) => {
                      const last = i === result.timeline.length - 1;
                      return (
                        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                          {i < result.timeline.length - 1 && (
                            <span className="absolute left-[7px] top-4 h-full w-0.5 bg-border" />
                          )}
                          <span
                            className={
                              "relative mt-1 size-3.5 shrink-0 rounded-full border-2 " +
                              (last
                                ? "border-gold-deep bg-gold"
                                : "border-primary/50 bg-background")
                            }
                          />
                          <div>
                            <p className="text-sm font-bold leading-snug">{event.note}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {event.place} • {event.time}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/40 px-6 py-5 sm:px-8">
                  <FileSpreadsheet className="size-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Konsumen hanya dapat melihat data harga dan status paket. Untuk
                    faktur/invoice silakan hubungi admin.
                  </p>
                  <Link
                    to="/kontak"
                    className="ml-auto rounded-full border border-border px-4 py-2 text-xs font-bold transition-colors hover:bg-muted"
                  >
                    Hubungi Admin
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
                <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <ScanBarcode className="size-8" />
                </span>
                <h2 className="mt-5 text-xl font-extrabold">Belum ada paket ditampilkan</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Isi nama dan nomor resi pada formulir, lalu tekan{" "}
                  <strong>Cek Status Paket</strong>. Riwayat perjalanan, status, dan
                  ongkir akan tampil di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Clock;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-extrabold">
        {Icon && <Icon className="size-4 text-gold-deep" />}
        {value}
      </p>
    </div>
  );
}
