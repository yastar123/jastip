import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ScanBarcode, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { type PublicTrackingResult } from "@/lib/tracking";
import { useCMS } from "@/lib/cms-context";
import { type AppCMSData } from "@/lib/cms-types";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/lacak")({
  component: LacakRouteComponent,
  head: () => ({
    meta: [
      { title: "Lacak Paket — Jastip Anggun Jaya" },
      {
        name: "description",
        content:
          "Cek status dan detail paket Jastip Anggun Jaya dengan nomor resi, nama penerima opsional.",
      },
      { property: "og:title", content: "Lacak Paket — Jastip Anggun Jaya" },
      {
        property: "og:description",
        content: "Masukkan nomor resi untuk melihat status dan detail paket Anda.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/lacak` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lacak Paket — Jastip Anggun Jaya" },
      {
        name: "twitter:description",
        content: "Cek status dan detail paket Jastip Anggun Jaya menggunakan nomor resi.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/lacak` }],
  }),
});

export function LacakPageView({ previewData }: { previewData?: AppCMSData }) {
  const { data } = useCMS();
  const cms = previewData || data;
  const lcp = cms.lacakPage || {
    headerBadge: "Lacak Paket",
    headerTitle: "Cek posisi paket Anda di sini",
    headerDescription:
      "Masukkan nomor resi untuk melihat status dan detail paket. Nama penerima boleh diisi jika diperlukan.",
    cardDisclaimer:
      "Nomor resi wajib diisi; nama penerima opsional. Detail paket ditampilkan tanpa harga atau nominal. Invoice tidak tersedia untuk konsumen.",
    demoBoxTitle: "Data Resi Terdaftar",
    demoBoxDescription:
      "Klik salah satu contoh di bawah untuk mencoba pelacakan. Data dikelola admin melalui Dashboard dan diperbarui secara real-time.",
    invoiceNotice:
      "Informasi harga dan nominal tidak ditampilkan. Untuk pertanyaan lebih lanjut, silakan hubungi admin.",
    emptyNoticeTitle: "Belum ada paket ditampilkan",
    emptyNoticeText:
      "Isi nomor resi untuk melihat detail paket. Nama penerima opsional dan dapat membantu jika resi tidak ditemukan.",
  };

  const [resi, setResi] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resi.trim()) {
      setResult(null);
      setError("Nomor resi wajib diisi.");
      return;
    }

    setIsSearching(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, resi: resi.trim() }),
      });
      const payload = (await response.json()) as {
        data?: PublicTrackingResult;
        error?: string;
      };
      if (!response.ok || !payload.data) {
        setError(payload.error || "Pelacakan gagal. Silakan coba lagi.");
        return;
      }
      setResult(payload.data);
    } catch {
      setResult(null);
      setError("Layanan pelacakan tidak dapat dihubungi. Silakan coba lagi.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      {/* Header halaman */}
      <section className="relative overflow-hidden bg-gradient-red">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">{lcp.headerBadge}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            {lcp.headerTitle}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            {lcp.headerDescription}
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
                <span className="text-sm font-bold">Nama Penerima / Pengirim (Opsional)</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Boleh dikosongkan"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="mt-4 block">
                <span className="text-sm font-bold">Nomor Resi</span>
                <input
                  value={resi}
                  onChange={(e) => setResi(e.target.value)}
                  autoComplete="off"
                  required
                  placeholder="Contoh: AJH-1024"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm uppercase outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="submit"
                disabled={isSearching}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary-deep"
              >
                {isSearching ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {isSearching ? "Mencari Paket..." : "Cek Status Paket"}
              </button>
              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-accent/50 px-4 py-3.5 text-xs leading-relaxed text-accent-foreground">
                <CircleCheck className="mt-0.5 size-4 shrink-0" />
                <span>{lcp.cardDisclaimer}</span>
              </div>
            </form>
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
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-extrabold text-primary-deep">
                    <CircleCheck className="size-4" />
                    {result.status}
                  </span>
                </div>

                <div className="px-6 py-6 sm:px-8">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="No Paket" value={result.packageNumber || "-"} />
                    <Detail label="Tanggal" value={formatPackageDate(result.packageDate)} />
                    <Detail label="Jenis Jastip" value={result.serviceType || "-"} />
                    <Detail label="Rute Pengiriman" value={result.route || "-"} />
                    <Detail label="Berat Real" value={formatWeight(result.realWeight)} />
                    <Detail label="Berat Volume" value={formatWeight(result.volumeWeight)} />
                    <Detail label="Berat Digunakan" value={formatWeight(result.billableWeight)} />
                    <Detail
                      label="Keterangan Biaya Tambahan"
                      value={result.additionalFeeDescription || "-"}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/40 px-6 py-5 sm:px-8">
                  <p className="text-xs text-muted-foreground">{lcp.invoiceNotice}</p>
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
                <h2 className="mt-5 text-xl font-extrabold">{lcp.emptyNoticeTitle}</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {lcp.emptyNoticeText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPackageDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatWeight(value: string | null): string {
  if (!value) return "-";
  const weight = Number(value.replace(",", "."));
  if (!Number.isFinite(weight)) return value;
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(weight)} Kg`;
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
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-extrabold">
        {Icon && <Icon className="size-4 text-gold-deep" />}
        {value}
      </p>
    </div>
  );
}

function LacakRouteComponent() {
  return <LacakPageView />;
}
