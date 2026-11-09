import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  ScanBarcode,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MapPin,
  CalendarDays,
  Weight,
  Wallet,
  UserRound,
  PackageCheck,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
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
          "Cari seluruh paket Jastip Anggun Jaya berdasarkan nama konsumen, atau cek detail paket dengan nomor resi.",
      },
      { property: "og:title", content: "Lacak Paket — Jastip Anggun Jaya" },
      {
        property: "og:description",
        content:
          "Cari seluruh paket berdasarkan nama konsumen, atau cek detail paket dengan nomor resi.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/lacak` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lacak Paket — Jastip Anggun Jaya" },
      {
        name: "twitter:description",
        content:
          "Cari seluruh paket berdasarkan nama konsumen, atau cek detail paket dengan nomor resi.",
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
      "Cari semua paket berdasarkan nama konsumen, atau cek detail satu paket menggunakan nomor resi.",
    cardDisclaimer:
      "Cari Nama menampilkan semua paket yang cocok. Paket yang sudah tiba menampilkan nama, berat, ongkir, dan status pengambilan.",
    demoBoxTitle: "Data Resi Terdaftar",
    demoBoxDescription: "Masukkan nama lengkap atau nomor resi untuk melihat status paket.",
    invoiceNotice: "Status pengambilan diperbarui oleh admin gudang Manokwari.",
    emptyNoticeTitle: "Belum ada paket ditampilkan",
    emptyNoticeText: "Pilih metode pencarian, lalu masukkan nama konsumen atau nomor resi.",
  };

  const [searchBy, setSearchBy] = useState<"name" | "resi">("name");
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<PublicTrackingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setResults([]);
      setError(searchBy === "name" ? "Nama konsumen wajib diisi." : "Nomor resi wajib diisi.");
      return;
    }

    setIsSearching(true);
    setResults([]);
    setError(null);
    try {
      const response = await fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchBy,
          [searchBy]: searchValue.trim(),
        }),
      });
      const payload = (await response.json()) as {
        data?: PublicTrackingResult[];
        error?: string;
      };
      if (!response.ok || !payload.data) {
        setError(payload.error || "Pelacakan gagal. Silakan coba lagi.");
        return;
      }
      setResults(payload.data);
    } catch {
      setResults([]);
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
            Cari semua paket berdasarkan nama konsumen, atau cek satu paket dengan nomor resi.
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Jastip Anggun Jaya
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">Tracking Paket</h2>
                </div>
                <ScanBarcode className="size-8 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cari posisi dan status paket Anda
              </p>
              <div className="gold-rule mt-3 w-14" />
              <div
                className="mt-5 grid grid-cols-2 rounded-full bg-secondary p-1"
                role="tablist"
                aria-label="Metode pencarian paket"
              >
                {[
                  { id: "name", label: "Cari Nama" },
                  { id: "resi", label: "Cari Resi" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={searchBy === item.id}
                    onClick={() => {
                      setSearchBy(item.id as "name" | "resi");
                      setSearchValue("");
                      setResults([]);
                      setError(null);
                    }}
                    className={
                      "rounded-full px-4 py-2.5 text-sm font-bold transition-colors " +
                      (searchBy === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="mt-5 block">
                <span className="text-sm font-bold">
                  {searchBy === "name" ? "Nama Konsumen" : "Nomor Resi"}
                </span>
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoComplete="off"
                  required
                  placeholder={
                    searchBy === "name"
                      ? "Masukkan nama sesuai pendaftaran"
                      : "Contoh: JNT001234567"
                  }
                  className="mt-2 w-full rounded-full border border-input bg-background px-5 py-3.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="submit"
                disabled={isSearching}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary-deep disabled:opacity-60"
              >
                {isSearching ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {isSearching ? "Mencari Paket..." : "Cari Paket"}
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
                  Cari Nama menampilkan semua paket yang cocok. Paket yang sudah tiba menampilkan
                  nama, berat, ongkir, dan status pengambilan.
                </span>
              </div>
            </form>
          </div>

          {/* HASIL */}
          <div aria-live="polite">
            {results.length > 0 ? (
              searchBy === "name" ? (
                <NameSearchResults results={results} />
              ) : (
                <ResiSearchResult result={results[0]!} />
              )
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
                <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <ScanBarcode className="size-8" />
                </span>
                <h2 className="mt-5 text-xl font-extrabold">{lcp.emptyNoticeTitle}</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Pilih metode pencarian, lalu masukkan nama konsumen atau nomor resi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NameSearchResults({ results }: { results: PublicTrackingResult[] }) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "not-picked-up" | "picked-up" | "in-transit"
  >("all");
  const filters = [
    { id: "all", label: "Semua Paket" },
    { id: "not-picked-up", label: "Bisa Diambil" },
    { id: "picked-up", label: "Sudah Diambil" },
    { id: "in-transit", label: "Dalam Perjalanan" },
  ] as const;
  const filteredResults = results.filter((result) => {
    switch (statusFilter) {
      case "not-picked-up":
        return result.arrivedAtDestination && !result.pickedUp;
      case "picked-up":
        return result.pickedUp;
      case "in-transit":
        return !result.arrivedAtDestination;
      default:
        return true;
    }
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Hasil Pencarian</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {filteredResults.length} dari {results.length} paket berdasarkan nama
        </p>
      </div>
      <div
        className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-4"
        role="group"
        aria-label="Filter status paket"
      >
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={statusFilter === filter.id}
            onClick={() => setStatusFilter(filter.id)}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-colors sm:text-sm ${
              statusFilter === filter.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {filteredResults.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          Tidak ada paket dengan status{" "}
          {filters.find((filter) => filter.id === statusFilter)?.label}.
        </p>
      ) : (
        filteredResults.map((result) => (
          <article
            key={`${result.resi}-${result.packageNumber ?? ""}`}
            className="rounded-3xl border border-border bg-card shadow-elegant"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-secondary/50 px-5 py-5 sm:px-7">
              <div>
                <h3 className="text-lg font-extrabold">{result.serviceType || "Paket"}</h3>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{result.resi}</p>
              </div>
              <StatusBadge result={result} />
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-7">
              <PackageTrackingSummary result={result} />
              {result.arrivedAtDestination ? (
                <PackageDetailList result={result} />
              ) : (
                <TransitNotice />
              )}
              <ContactAdminLink />
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function ResiSearchResult({ result }: { result: PublicTrackingResult }) {
  return (
    <article className="rounded-3xl border border-border bg-card shadow-elegant">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-secondary/50 px-5 py-5 sm:px-7">
        <div>
          <h2 className="text-xl font-extrabold">{result.serviceType || "Paket"}</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{result.resi}</p>
        </div>
        <StatusBadge result={result} />
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-7">
        <PackageTrackingSummary result={result} />
        {result.arrivedAtDestination ? <PackageDetailList result={result} /> : <TransitNotice />}
        <ContactAdminLink />
      </div>
    </article>
  );
}

function PackageTrackingSummary({ result }: { result: PublicTrackingResult }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      <SummaryItem
        icon={MapPin}
        label="Lokasi terakhir"
        value={result.lastLocation || "Dalam Perjalanan ke Manokwari"}
      />
      <SummaryItem
        icon={CalendarDays}
        label="Tanggal update"
        value={formatPackageDate(result.lastUpdated || result.packageDate)}
      />
    </div>
  );
}

function PackageDetailList({ result }: { result: PublicTrackingResult }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      <Detail icon={UserRound} label="Nama" value={result.customerName || "-"} />
      <Detail icon={PackageCheck} label="Jenis Jastip" value={result.serviceType || "-"} />
      <Detail
        icon={Weight}
        label="Berat / Volume"
        value={`${formatWeight(result.realWeight)} / ${formatWeight(result.volumeWeight)}`}
      />
      <Detail icon={Wallet} label="Ongkir" value={formatRupiah(result.totalShipping)} />
      <Detail
        icon={CircleCheck}
        label="Pembayaran"
        value={result.pickedUp ? "Sudah Dibayar" : "Belum Dibayar"}
      />
    </div>
  );
}

function TransitNotice() {
  return (
    <div className="rounded-2xl bg-accent/50 px-4 py-4 text-sm leading-relaxed text-accent-foreground">
      Paket masih dalam proses perjalanan menuju Manokwari. Detail berat dan ongkir akan ditampilkan
      setelah paket tiba dan diverifikasi di gudang Manokwari.
    </div>
  );
}

function ContactAdminLink() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/kontak"
        className="ml-auto rounded-full border border-border px-4 py-2 text-xs font-bold transition-colors hover:bg-muted"
      >
        Hubungi Admin
      </Link>
    </div>
  );
}

function StatusBadge({ result }: { result: PublicTrackingResult }) {
  const className = result.pickedUp
    ? "bg-muted text-muted-foreground"
    : result.arrivedAtDestination
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "bg-accent text-accent-foreground";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${className}`}
    >
      <CircleCheck className="size-4" />
      {result.status}
    </span>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-background px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-gold-deep" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words font-bold">{value}</p>
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

function formatRupiah(value: string | null): string {
  if (!value) return "-";
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function Detail({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-gold-deep" />
        {label}
      </span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

function LacakRouteComponent() {
  return <LacakPageView />;
}
