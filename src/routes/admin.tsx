import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SlidersHorizontal,
  Home,
  Package,
  Truck,
  Building,
  RotateCcw,
  Save,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  Lock,
  LogOut,
  User,
  KeyRound,
  ShieldCheck,
  Globe,
  MapPin,
  Clock,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { useCMS } from "@/lib/cms-context";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.png.asset.json";
import heroImg from "@/assets/hero.jpg";
import portImg from "@/assets/port.jpg";
import { HomePageView } from "./index";
import { LayananPageView } from "./layanan";
import { LacakPageView } from "./lacak";
import { KontakPageView } from "./kontak";
import { type Shipment } from "@/lib/tracking";
import { type Service } from "@/lib/services";
import { formatRupiah } from "@/lib/site";
import { toast } from "sonner";
import { ImageUploaderControl } from "@/components/admin/image-uploader-control";
import { FloatingSaveBar, TabSaveFooter } from "@/components/admin/save-bars";
import { MediaCMSPanel } from "@/components/admin/media-cms-panel";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Jastip Anggun Jaya" },
      {
        name: "description",
        content: "Kelola seluruh konten halaman publik, layanan, tarif, dan data resi paket.",
      },
    ],
  }),
});

type AdminTab =
  "overview" | "home" | "services" | "lacak" | "contact" | "media" | "global" | "preview";

function AdminDashboard() {
  const { isAuthenticated, user, logout, isLoading: isAuthLoading } = useAuth();
  const {
    draftData,
    updateDraft,
    saveChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving,
    lastSavedAt,
    discardDraft,
    dbStatus,
    activePreviewPage,
    setActivePreviewPage,
    previewDevice,
    setPreviewDevice,
  } = useCMS();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [showLivePreview, setShowLivePreview] = useState<boolean>(true);

  const handleSave = useCallback(async () => {
    const success = await saveChanges();
    if (success) {
      toast.success("Perubahan berhasil disimpan ke database dan aktif di website!");
    } else {
      toast.error("Gagal menyimpan ke database");
    }
  }, [saveChanges]);

  // Global keyboard shortcut: Ctrl+S or Cmd+S to save changes
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const handleReset = async () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan semua konten ke data awal (default)?")) {
      const ok = await resetToDefaults();
      if (ok) {
        toast.info("Konten dikembalikan ke default bawaan.");
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat sesi admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginView />;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* TOP HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-red text-primary-foreground shadow-sm">
            <SlidersHorizontal className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight">Dashboard Admin</span>
              <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                Editor Realtime
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{draftData.site.name} • Manokwari</p>
          </div>
        </div>

        {/* Database & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* DB Indicator */}
          <div
            className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold sm:flex"
            title={
              dbStatus?.isPostgresConnected
                ? "Terhubung ke Database PostgreSQL"
                : "Menggunakan Persistent Storage (.env / PostgreSQL Ready)"
            }
          >
            <Database
              className={
                "size-3.5 " +
                (dbStatus?.isPostgresConnected ? "text-emerald-500" : "text-amber-500")
              }
            />
            <span className="text-[11px]">
              {dbStatus?.isPostgresConnected ? "PostgreSQL Aktif" : "Storage Aktif"}
            </span>
          </div>

          {/* Unsaved indicator */}
          {hasUnsavedChanges && (
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 md:inline-flex">
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              Perubahan belum disimpan
            </span>
          )}

          {/* Toggle Live Preview */}
          <button
            type="button"
            onClick={() => setShowLivePreview((v) => !v)}
            className={
              "hidden items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors lg:inline-flex " +
              (showLivePreview
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted")
            }
          >
            {showLivePreview ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            <span>Preview Split</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Reset ke Default"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-deep disabled:opacity-50"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>

          {/* User info */}
          <div className="hidden items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold sm:flex">
            <User className="size-3.5 text-primary" />
            <span className="max-w-[140px] truncate">{user?.email || "Admin"}</span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              logout();
              toast.info("Anda berhasil keluar dari sesi admin.");
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20"
            title="Keluar (Logout)"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>

          {/* Public Site Link */}
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold transition-colors hover:bg-muted"
            title="Buka Website Publik"
          >
            <span className="hidden sm:inline">Website</span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-16 shrink-0 border-r border-border bg-card/60 sm:w-64">
          <div className="p-3">
            <div className="mb-2 hidden px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:block">
              Halaman Public
            </div>
            <nav className="space-y-1">
              {[
                { id: "overview", label: "Ringkasan Dashboard", icon: SlidersHorizontal },
                { id: "home", label: "Halaman Beranda (/)", icon: Home },
                { id: "services", label: "Halaman Layanan (/layanan)", icon: Package },
                { id: "lacak", label: "Halaman Lacak (/lacak)", icon: Truck },
                { id: "contact", label: "Halaman Kontak (/kontak)", icon: MapPin },
                { id: "media", label: "Galeri & Gambar", icon: ImageIcon },
                { id: "global", label: "Header, Footer & Brand", icon: Globe },
                { id: "preview", label: "Live Preview Penuh", icon: Eye },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      // Auto switch preview page if applicable
                      if (item.id === "home") setActivePreviewPage("/");
                      if (item.id === "services") setActivePreviewPage("/layanan");
                      if (item.id === "lacak") setActivePreviewPage("/lacak");
                      if (item.id === "contact") setActivePreviewPage("/kontak");
                    }}
                    className={
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-colors sm:text-sm " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground")
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CMS FORM PANELS (LEFT OR FULL) */}
        <div
          className={
            "flex-1 overflow-y-auto p-4 sm:p-6 " +
            (showLivePreview && activeTab !== "preview" ? "lg:w-1/2 lg:flex-none" : "w-full")
          }
        >
          {activeTab === "overview" && (
            <OverviewPanel
              onNavigate={(tab) => {
                setActiveTab(tab);
                if (tab === "home") setActivePreviewPage("/");
                if (tab === "services") setActivePreviewPage("/layanan");
                if (tab === "lacak") setActivePreviewPage("/lacak");
                if (tab === "contact") setActivePreviewPage("/kontak");
                if (tab === "media") setActivePreviewPage("/");
              }}
              shipmentsCount={draftData.shipments.length}
              servicesCount={draftData.services.length}
              dbEngine={dbStatus?.engine || "Persistent JSON / PostgreSQL Ready"}
            />
          )}

          {activeTab === "home" && <HomeCMSPanel onSave={handleSave} />}
          {activeTab === "services" && <ServicesCMSPanel onSave={handleSave} />}
          {activeTab === "lacak" && <LacakPageCMSPanel onSave={handleSave} />}
          {activeTab === "contact" && <KontakPageCMSPanel onSave={handleSave} />}
          {activeTab === "media" && <MediaCMSPanel onSave={handleSave} />}
          {activeTab === "global" && <GlobalBrandCMSPanel onSave={handleSave} />}

          {activeTab === "preview" && (
            <div className="flex h-full flex-col">
              <PreviewToolbar
                activePage={activePreviewPage}
                setActivePage={setActivePreviewPage}
                device={previewDevice}
                setDevice={setPreviewDevice}
              />
              <div className="flex flex-1 items-center justify-center overflow-auto rounded-2xl border border-border bg-muted/40 p-4">
                <PreviewFrame page={activePreviewPage} device={previewDevice} />
              </div>
            </div>
          )}
        </div>

        {/* SPLIT LIVE PREVIEW (RIGHT SIDE) */}
        {showLivePreview && activeTab !== "preview" && (
          <div className="hidden flex-1 flex-col border-l border-border bg-muted/30 lg:flex">
            <PreviewToolbar
              activePage={activePreviewPage}
              setActivePage={setActivePreviewPage}
              device={previewDevice}
              setDevice={setPreviewDevice}
            />
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <PreviewFrame page={activePreviewPage} device={previewDevice} />
            </div>
          </div>
        )}
      </div>

      {/* FLOATING SAVE BAR */}
      <FloatingSaveBar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        onSave={handleSave}
        onReset={() => {
          if (confirm("Batalkan semua perubahan draft dan kembalikan ke data tersimpan?")) {
            discardDraft();
            toast.info("Perubahan draft dibatalkan.");
          }
        }}
      />
    </div>
  );
}

/* ================= PREVIEW TOOLBAR & FRAME ================= */

function PreviewToolbar({
  activePage,
  setActivePage,
  device,
  setDevice,
}: {
  activePage: string;
  setActivePage: (p: string) => void;
  device: "desktop" | "tablet" | "mobile";
  setDevice: (d: "desktop" | "tablet" | "mobile") => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5">
      {/* Page switcher */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-muted-foreground">Preview:</span>
        {[
          { path: "/", label: "Beranda" },
          { path: "/layanan", label: "Layanan" },
          { path: "/lacak", label: "Lacak" },
          { path: "/kontak", label: "Kontak" },
        ].map((p) => (
          <button
            key={p.path}
            type="button"
            onClick={() => setActivePage(p.path)}
            className={
              "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors " +
              (activePage === p.path
                ? "bg-secondary text-primary-deep"
                : "text-muted-foreground hover:bg-muted")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Device frame switcher */}
      <div className="flex items-center gap-1">
        {[
          { id: "desktop", icon: Laptop, label: "Desktop" },
          { id: "tablet", icon: Tablet, label: "Tablet" },
          { id: "mobile", icon: Smartphone, label: "HP" },
        ].map((d) => {
          const Icon = d.icon;
          const active = device === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDevice(d.id as "desktop" | "tablet" | "mobile")}
              className={
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold " +
                (active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
              title={d.label}
            >
              <Icon className="size-3.5" />
              <span className="hidden xl:inline">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewFrame({ page, device }: { page: string; device: "desktop" | "tablet" | "mobile" }) {
  const { draftData } = useCMS();

  const widthStyle =
    device === "mobile"
      ? "w-[375px] max-w-full"
      : device === "tablet"
        ? "w-[768px] max-w-full"
        : "w-full";

  return (
    <div
      className={
        "h-full overflow-y-auto rounded-xl border border-border bg-background shadow-2xl transition-all duration-300 " +
        widthStyle
      }
    >
      <div className="sticky top-0 z-10 flex h-7 items-center justify-between border-b border-border bg-muted/80 px-3 text-[11px] text-muted-foreground backdrop-blur-sm">
        <span className="font-mono">https://jastipanggunjaya.com{page}</span>
        <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          Live Render
        </span>
      </div>
      <div>
        {page === "/" && <HomePageView previewData={draftData} />}
        {page === "/layanan" && <LayananPageView previewData={draftData} />}
        {page === "/lacak" && <LacakPageView previewData={draftData} />}
        {page === "/kontak" && <KontakPageView previewData={draftData} />}
      </div>
    </div>
  );
}

/* ================= OVERVIEW PANEL ================= */

function OverviewPanel({
  onNavigate,
  shipmentsCount,
  servicesCount,
  dbEngine,
}: {
  onNavigate: (tab: AdminTab) => void;
  shipmentsCount: number;
  servicesCount: number;
  dbEngine: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ringkasan Dashboard Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola seluruh konten halaman publik (Beranda, Layanan & Tarif, Lacak Paket, Kontak) serta
          basis data resi pengiriman.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Layanan Tersedia
          </p>
          <p className="mt-2 text-3xl font-extrabold text-primary">{servicesCount}</p>
          <button
            type="button"
            onClick={() => onNavigate("services")}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-deep hover:underline"
          >
            Kelola Halaman Layanan <ArrowRight className="size-3" />
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resi Paket Terdaftar
          </p>
          <p className="mt-2 text-3xl font-extrabold text-gold-deep">{shipmentsCount}</p>
          <button
            type="button"
            onClick={() => onNavigate("lacak")}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Kelola Halaman Lacak & Resi <ArrowRight className="size-3" />
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Status Database
          </p>
          <p className="mt-2 text-lg font-extrabold leading-snug">{dbEngine}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" /> Siap Produksi & Terhubung
          </span>
        </div>
      </div>

      {/* QUICK SHORTCUTS FOR ALL PUBLIC PAGES */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-extrabold">Kelola Konten Halaman Public Website</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-gold hover:bg-secondary/40"
          >
            <div>
              <p className="font-bold">1. Halaman Beranda (/)</p>
              <p className="text-xs text-muted-foreground">
                Hero banner, 3 langkah kirim, keunggulan, jangkauan & CTA
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("services")}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-gold hover:bg-secondary/40"
          >
            <div>
              <p className="font-bold">2. Halaman Layanan & Tarif (/layanan)</p>
              <p className="text-xs text-muted-foreground">
                Judul halaman, tabel tarif, paket hemat, pesawat, kargo, pelni
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("lacak")}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-gold hover:bg-secondary/40"
          >
            <div>
              <p className="font-bold">3. Halaman Lacak Paket (/lacak)</p>
              <p className="text-xs text-muted-foreground">
                Teks petunjuk lacak, disclaimer, dan database nomor resi
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("contact")}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-gold hover:bg-secondary/40"
          >
            <div>
              <p className="font-bold">4. Halaman Kontak & Lokasi (/kontak)</p>
              <p className="text-xs text-muted-foreground">
                Alamat gudang Manokwari, jam layanan, WhatsApp & kotak info
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("global")}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-gold hover:bg-secondary/40"
          >
            <div>
              <p className="font-bold">5. Header, Footer & Global Brand</p>
              <p className="text-xs text-muted-foreground">
                Nama usaha, tagline, teks hak cipta & template WhatsApp
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("media")}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-gold hover:bg-secondary/40"
          >
            <div>
              <p className="font-bold text-primary">6. Galeri & Manajemen Gambar (Media)</p>
              <p className="text-xs text-muted-foreground">
                Upload foto baru, gambar hero beranda, pelabuhan, logo & armada
              </p>
            </div>
            <ArrowRight className="size-4 text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= 1. HOME CMS PANEL ================= */

function HomeCMSPanel({ onSave }: { onSave?: () => void }) {
  const { draftData, updateDraft, isSaving, hasUnsavedChanges, lastSavedAt, discardDraft } =
    useCMS();
  const home = draftData.home;

  const handleHomeImageChange = (key: "heroImage" | "portImage", value: string) => {
    updateDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        [key]: value,
      },
    }));
  };

  const handleHeroChange = (key: string, value: string) => {
    updateDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        hero: {
          ...prev.home.hero,
          [key]: value,
        },
      },
    }));
  };

  const handleStatChange = (index: number, key: "number" | "label", val: string) => {
    updateDraft((prev) => {
      const stats = [...prev.home.hero.stats];
      const target = stats[index];
      if (target) {
        stats[index] = { ...target, [key]: val };
      }
      return {
        ...prev,
        home: {
          ...prev.home,
          hero: { ...prev.home.hero, stats },
        },
      };
    });
  };

  const handleStepChange = (index: number, key: "title" | "text", val: string) => {
    updateDraft((prev) => {
      const steps = [...prev.home.steps];
      const target = steps[index];
      if (target) {
        steps[index] = { ...target, [key]: val };
      }
      return {
        ...prev,
        home: {
          ...prev.home,
          steps,
        },
      };
    });
  };

  const handleFeatureChange = (index: number, key: "title" | "text", val: string) => {
    updateDraft((prev) => {
      const features = [...prev.home.features];
      const target = features[index];
      if (target) {
        features[index] = { ...target, [key]: val };
      }
      return {
        ...prev,
        home: {
          ...prev.home,
          features,
        },
      };
    });
  };

  const handleCtaChange = (key: "title" | "text" | "buttonText", val: string) => {
    updateDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        cta: {
          ...prev.home.cta,
          [key]: val,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Halaman Beranda (/)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola seluruh teks banner Hero, 3 angka statistik, langkah proses kirim, keunggulan, dan
          CTA lacak paket.
        </p>
      </div>

      {/* SECTION HERO */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">Bagian Hero Utama</h2>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Badge Rute</label>
          <input
            value={home.hero.badge}
            onChange={(e) => handleHeroChange("badge", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul (Awalan)
            </label>
            <input
              value={home.hero.titlePrefix}
              onChange={(e) => handleHeroChange("titlePrefix", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul (Emas / Aksen)
            </label>
            <input
              value={home.hero.titleHighlight}
              onChange={(e) => handleHeroChange("titleHighlight", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul (Akhiran)
            </label>
            <input
              value={home.hero.titleSuffix}
              onChange={(e) => handleHeroChange("titleSuffix", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Deskripsi Hero
          </label>
          <textarea
            rows={2}
            value={home.hero.description}
            onChange={(e) => handleHeroChange("description", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* STATS */}
        <div className="border-t border-border pt-4">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            3 Kotak Angka Statistik Hero
          </label>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {home.hero.stats.map((st, i) => (
              <div key={i} className="flex gap-2 rounded-xl border border-border bg-background p-3">
                <input
                  value={st.number}
                  onChange={(e) => handleStatChange(i, "number", e.target.value)}
                  className="w-16 rounded-lg border border-input bg-card px-2 py-1 text-center font-extrabold text-primary outline-none"
                  placeholder="Angka"
                />
                <input
                  value={st.label}
                  onChange={(e) => handleStatChange(i, "label", e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-card px-2 py-1 text-xs outline-none"
                  placeholder="Label"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 LANGKAH */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">Cara Kerja (3 Langkah)</h2>
        <div className="space-y-3">
          {home.steps.map((st, idx) => (
            <div key={st.no} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gold-deep">{st.no}</span>
                <input
                  value={st.title}
                  onChange={(e) => handleStepChange(idx, "title", e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-bold outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={st.text}
                onChange={(e) => handleStepChange(idx, "text", e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4 KEUNGGULAN */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">Keunggulan (Kenapa Kami)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {home.features.map((f, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-background p-4">
              <input
                value={f.title}
                onChange={(e) => handleFeatureChange(idx, "title", e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-bold outline-none"
              />
              <textarea
                rows={2}
                value={f.text}
                onChange={(e) => handleFeatureChange(idx, "text", e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* GAMBAR BERANDA */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground">
          Gambar & Visual Halaman Beranda
        </h2>
        <ImageUploaderControl
          label="Gambar Hero Banner (Latar Belakang Utama)"
          description="Latar belakang visual di seksi paling atas halaman Beranda."
          value={home.heroImage}
          defaultValue={heroImg}
          aspectRatio="16/9"
          filterCategory="kontainer"
          onChange={(val) => handleHomeImageChange("heroImage", val)}
        />
        <ImageUploaderControl
          label="Gambar Jangkauan & Pelabuhan Kargo"
          description="Latar belakang visual di seksi jangkauan rute kota besar ke Manokwari."
          value={home.portImage}
          defaultValue={portImg}
          aspectRatio="16/9"
          filterCategory="kapal"
          onChange={(val) => handleHomeImageChange("portImage", val)}
        />
      </div>

      {/* CTA BANNER */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-base font-extrabold">Banner Bawah (CTA Lacak)</h2>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Judul Banner</label>
          <input
            value={home.cta.title}
            onChange={(e) => handleCtaChange("title", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Deskripsi Banner
          </label>
          <textarea
            rows={2}
            value={home.cta.text}
            onChange={(e) => handleCtaChange("text", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* SAVE FOOTER */}
      <TabSaveFooter
        pageName="Halaman Beranda"
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onSave={() => onSave?.()}
        onReset={discardDraft}
      />
    </div>
  );
}

/* ================= 2. SERVICES CMS PANEL ================= */

function ServicesCMSPanel({ onSave }: { onSave?: () => void }) {
  const { draftData, updateDraft, isSaving, hasUnsavedChanges, lastSavedAt, discardDraft } =
    useCMS();
  const services = draftData.services;
  const lp = draftData.layananPage || {
    headerBadge: "Layanan & Tarif",
    headerTitle: `${services.length} pilihan layanan ke Manokwari`,
    headerDescription:
      "Semua tarif di bawah ini transparan dan resmi — pilih sesuai kebutuhan kecepatan, berat, dan volume paket Anda.",
    ctaTitle: "Belum yakin pilih yang mana?",
    ctaDescription:
      "Konsultasikan kebutuhan pengiriman Anda dengan admin — kami bantu pilihkan layanan yang paling hemat dan cepat.",
    ctaButtonText: "Hubungi Admin",
  };

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || "hemat");

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0];

  const updateLayananHeader = (key: keyof typeof lp, val: string) => {
    updateDraft((prev) => ({
      ...prev,
      layananPage: {
        ...prev.layananPage,
        [key]: val,
      },
    }));
  };

  const updateCurrentService = (updater: (s: Service) => Service) => {
    if (!currentService) return;
    updateDraft((prev) => {
      const idx = prev.services.findIndex((s) => s.id === currentService.id);
      if (idx === -1) return prev;
      const updated = [...prev.services];
      const target = updated[idx];
      if (target) {
        updated[idx] = updater(target);
      }
      return { ...prev, services: updated };
    });
  };

  const handleAddNewService = () => {
    const id = `layanan-${Date.now().toString().slice(-4)}`;
    const newService: Service = {
      id,
      name: "Layanan Baru",
      route: "Jakarta / Surabaya → Manokwari",
      mode: "Flat / kg",
      unit: "per kg",
      tagline: "Layanan pengiriman paket cepat dan terpercaya ke Manokwari.",
      startingFrom: 15000,
      options: ["1 Paket", "Grup Paket"],
      highlights: ["Tarif transparan", "Aman & cepat"],
      tables: [
        {
          columns: ["Berat Paket", "Ongkir"],
          rows: [
            { label: "1 kg", price: 15000 },
            { label: "5 kg", price: 75000 },
          ],
        },
      ],
      notes: ["Tarif dapat berubah sewaktu-waktu."],
    };

    updateDraft((prev) => ({
      ...prev,
      services: [...prev.services, newService],
    }));
    setSelectedServiceId(id);
    toast.success("Layanan baru ditambahkan!");
  };

  const handleDeleteService = (id: string) => {
    if (services.length <= 1) {
      toast.error("Minimal harus ada 1 layanan");
      return;
    }
    if (confirm("Hapus layanan ini?")) {
      updateDraft((prev) => ({
        ...prev,
        services: prev.services.filter((s) => s.id !== id),
      }));
      const remaining = services.filter((s) => s.id !== id);
      if (remaining[0]) {
        setSelectedServiceId(remaining[0].id);
      }
      toast.info("Layanan dihapus");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Halaman Layanan & Tarif (/layanan)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola teks header halaman layanan, daftar paket, rute, tabel tarif, dan banner bawah.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNewService}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-deep"
        >
          <Plus className="size-4" />
          Tambah Layanan Baru
        </button>
      </div>

      {/* HEADER HALAMAN LAYANAN */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">Header Halaman Layanan</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Badge Header
            </label>
            <input
              value={lp.headerBadge}
              onChange={(e) => updateLayananHeader("headerBadge", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul Utama Halaman
            </label>
            <input
              value={lp.headerTitle}
              onChange={(e) => updateLayananHeader("headerTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Deskripsi Header Halaman
          </label>
          <textarea
            rows={2}
            value={lp.headerDescription}
            onChange={(e) => updateLayananHeader("headerDescription", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* TABS OF SERVICES */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {services.map((srv) => (
          <button
            key={srv.id}
            type="button"
            onClick={() => setSelectedServiceId(srv.id)}
            className={
              "rounded-xl px-4 py-2 text-xs font-bold transition-all " +
              (selectedServiceId === srv.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-muted")
            }
          >
            {srv.name}
          </button>
        ))}
      </div>

      {currentService && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Edit Paket: {currentService.name}</h2>
            <button
              type="button"
              onClick={() => handleDeleteService(currentService.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              Hapus Layanan
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Nama Layanan
              </label>
              <input
                value={currentService.name}
                onChange={(e) => updateCurrentService((s) => ({ ...s, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Rute Pengiriman
              </label>
              <input
                value={currentService.route}
                onChange={(e) => updateCurrentService((s) => ({ ...s, route: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Mulai Dari (Rp)
              </label>
              <input
                type="number"
                value={currentService.startingFrom}
                onChange={(e) =>
                  updateCurrentService((s) => ({
                    ...s,
                    startingFrom: Number(e.target.value) || 0,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold text-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Satuan (misal: per kg)
              </label>
              <input
                value={currentService.unit}
                onChange={(e) => updateCurrentService((s) => ({ ...s, unit: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Mode Tarif
              </label>
              <input
                value={currentService.mode}
                onChange={(e) => updateCurrentService((s) => ({ ...s, mode: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Tagline</label>
            <textarea
              rows={2}
              value={currentService.tagline}
              onChange={(e) => updateCurrentService((s) => ({ ...s, tagline: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>

          {/* FOTO ARMADA / ILUSTRASI LAYANAN */}
          <ImageUploaderControl
            label={`Foto Armada / Ilustrasi: ${currentService.name}`}
            description={`Gambar visual yang ditampilkan di atas kartu layanan ${currentService.name}.`}
            value={currentService.image}
            defaultValue={
              currentService.id === "pelni"
                ? "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80"
                : currentService.id === "pesawat"
                  ? "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80"
                  : currentService.id === "kargo"
                    ? "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
                    : "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1200&q=80"
            }
            aspectRatio="16/9"
            onChange={(val) => updateCurrentService((s) => ({ ...s, image: val }))}
          />

          {/* TABEL TARIF EDITING */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-extrabold">Tabel Tarif</h3>
            {currentService.tables.map((table, tIdx) => (
              <div key={tIdx} className="mt-3 rounded-xl border border-border bg-background p-4">
                {table.title && (
                  <p className="mb-2 text-xs font-bold uppercase text-primary-deep">
                    {table.title}
                  </p>
                )}
                <div className="space-y-2">
                  {table.rows.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      <input
                        value={row.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentService((s) => {
                            const newTables = [...s.tables];
                            const targetTable = newTables[tIdx];
                            if (!targetTable) return s;
                            const newRows = [...targetTable.rows];
                            const targetRow = newRows[rIdx];
                            if (!targetRow) return s;
                            newRows[rIdx] = { ...targetRow, label: val };
                            newTables[tIdx] = { ...targetTable, rows: newRows };
                            return { ...s, tables: newTables };
                          });
                        }}
                        className="flex-1 rounded-lg border border-input bg-card px-2.5 py-1 text-xs outline-none"
                        placeholder="Berat / Keterangan"
                      />
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          updateCurrentService((s) => {
                            const newTables = [...s.tables];
                            const targetTable = newTables[tIdx];
                            if (!targetTable) return s;
                            const newRows = [...targetTable.rows];
                            const targetRow = newRows[rIdx];
                            if (!targetRow) return s;
                            newRows[rIdx] = { ...targetRow, price: val };
                            newTables[tIdx] = { ...targetTable, rows: newRows };
                            return { ...s, tables: newTables };
                          });
                        }}
                        className="w-28 rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-bold text-primary outline-none"
                        placeholder="Harga"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateCurrentService((s) => {
                            const newTables = [...s.tables];
                            const targetTable = newTables[tIdx];
                            if (!targetTable) return s;
                            const newRows = targetTable.rows.filter((_, i) => i !== rIdx);
                            newTables[tIdx] = { ...targetTable, rows: newRows };
                            return { ...s, tables: newTables };
                          });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentService((s) => {
                      const newTables = [...s.tables];
                      const targetTable = newTables[tIdx];
                      if (!targetTable) return s;
                      const newRows = [...targetTable.rows, { label: "Baris Baru", price: 20000 }];
                      newTables[tIdx] = { ...targetTable, rows: newRows };
                      return { ...s, tables: newTables };
                    });
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-deep hover:underline"
                >
                  <Plus className="size-3" /> Tambah Baris Harga
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA BAWAH LAYANAN */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-base font-extrabold">Banner Konsultasi Bawah Layanan</h2>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Judul Banner</label>
          <input
            value={lp.ctaTitle}
            onChange={(e) => updateLayananHeader("ctaTitle", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Deskripsi Banner
          </label>
          <textarea
            rows={2}
            value={lp.ctaDescription}
            onChange={(e) => updateLayananHeader("ctaDescription", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* SAVE FOOTER */}
      <TabSaveFooter
        pageName="Halaman Layanan & Tarif"
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onSave={() => onSave?.()}
        onReset={discardDraft}
      />
    </div>
  );
}

/* ================= 3. LACAK PAGE CMS PANEL ================= */

function LacakPageCMSPanel({ onSave }: { onSave?: () => void }) {
  const {
    draftData,
    updateDraft,
    addOrUpdateShipment,
    deleteShipment,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    discardDraft,
  } = useCMS();
  const lcp = draftData.lacakPage || {
    headerBadge: "Lacak Paket",
    headerTitle: "Cek posisi paket Anda di sini",
    headerDescription:
      "Masukkan nama dan nomor resi yang Anda terima saat titip paket. Pengecekan hanya bisa dilakukan dengan nama dan no resi — nomor HP tidak dapat digunakan.",
    cardDisclaimer:
      "Lacak paket hanya dengan nama + no resi. Hasil berupa data harga (ongkir) dan status paket — pembuatan/unduh invoice tidak tersedia untuk konsumen.",
    demoBoxTitle: "Data Resi Terdaftar",
    demoBoxDescription:
      "Klik salah satu contoh di bawah untuk mencoba pelacakan. Data dikelola admin melalui Dashboard dan diperbarui secara real-time.",
    invoiceNotice:
      "Konsumen hanya dapat melihat data harga dan status paket. Untuk faktur/invoice silakan hubungi admin.",
    emptyNoticeTitle: "Belum ada paket ditampilkan",
    emptyNoticeText:
      "Isi nama dan nomor resi pada formulir, lalu tekan Cek Status Paket. Riwayat perjalanan, status, dan ongkir akan tampil di sini.",
  };

  const shipments = draftData.shipments;
  const [search, setSearch] = useState("");
  const [editingResi, setEditingResi] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [formResi, setFormResi] = useState("");
  const [formName, setFormName] = useState("");
  const [formService, setFormService] = useState("Jastip Hemat");
  const [formRoute, setFormRoute] = useState("Surabaya → Manokwari");
  const [formWeight, setFormWeight] = useState("5 kg");
  const [formPrice, setFormPrice] = useState<number>(50000);
  const [formStatus, setFormStatus] = useState("Tiba di Manokwari — Siap Diambil");
  const [formStage, setFormStage] = useState<"diterima" | "perjalanan" | "tiba">("tiba");
  const [formUpdated, setFormUpdated] = useState("Hari ini, 10.00 WIT");
  const [formTimelineNote, setFormTimelineNote] = useState("Paket tiba di gudang Manokwari");

  const updateLacakField = (key: keyof typeof lcp, val: string) => {
    updateDraft((prev) => ({
      ...prev,
      lacakPage: {
        ...prev.lacakPage,
        [key]: val,
      },
    }));
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.resi.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const startCreate = () => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setFormResi(`AJH-${nextNum}`);
    setFormName("");
    setFormService("Jastip Hemat");
    setFormRoute("Surabaya → Manokwari");
    setFormWeight("5 kg");
    setFormPrice(50000);
    setFormStatus("Diterima di Gudang");
    setFormStage("diterima");
    setFormUpdated("Hari ini, 10.00 WIT");
    setFormTimelineNote("Paket diterima & barcode terpasang");
    setIsCreatingNew(true);
    setEditingResi(null);
  };

  const startEdit = (s: Shipment) => {
    setFormResi(s.resi);
    setFormName(s.name);
    setFormService(s.service);
    setFormRoute(s.route);
    setFormWeight(s.weight);
    setFormPrice(s.price);
    setFormStatus(s.status);
    setFormStage(s.stage);
    setFormUpdated(s.updated);
    setFormTimelineNote("");
    setEditingResi(s.resi);
    setIsCreatingNew(false);
  };

  const handleSaveForm = async () => {
    if (!formResi.trim() || !formName.trim()) {
      toast.error("Nomor resi dan nama penerima wajib diisi!");
      return;
    }

    const existing = shipments.find((s) => s.resi.toUpperCase() === formResi.trim().toUpperCase());
    let timeline = existing?.timeline || [];

    if (formTimelineNote.trim()) {
      timeline = [
        ...timeline,
        {
          time: formUpdated,
          place: formStage === "tiba" ? "Manokwari" : "Surabaya / Jakarta",
          note: formTimelineNote.trim(),
        },
      ];
    }

    if (timeline.length === 0) {
      timeline = [
        {
          time: formUpdated,
          place: "Gudang Asal",
          note: "Paket diterima di gudang",
        },
      ];
    }

    const newShipment: Shipment = {
      resi: formResi.trim().toUpperCase(),
      name: formName.trim(),
      service: formService,
      route: formRoute,
      weight: formWeight,
      price: formPrice,
      status: formStatus,
      stage: formStage,
      updated: formUpdated,
      timeline,
    };

    await addOrUpdateShipment(newShipment);
    toast.success(`Resi ${newShipment.resi} berhasil disimpan!`);
    setIsCreatingNew(false);
    setEditingResi(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Halaman Lacak Paket (/lacak)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola teks halaman lacak, disclaimer, teks kotak kosong, serta seluruh database nomor
            resi paket.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-deep"
        >
          <Plus className="size-4" />
          Tambah Resi Paket Baru
        </button>
      </div>

      {/* HEADER & TEXTS CMS */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">Teks Halaman Lacak Paket</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Badge Header
            </label>
            <input
              value={lcp.headerBadge}
              onChange={(e) => updateLacakField("headerBadge", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul Utama Header
            </label>
            <input
              value={lcp.headerTitle}
              onChange={(e) => updateLacakField("headerTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Petunjuk Header
          </label>
          <textarea
            rows={2}
            value={lcp.headerDescription}
            onChange={(e) => updateLacakField("headerDescription", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Teks Disclaimer Form Lacak
            </label>
            <textarea
              rows={2}
              value={lcp.cardDisclaimer}
              onChange={(e) => updateLacakField("cardDisclaimer", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Teks Notice Invoice / Faktur
            </label>
            <textarea
              rows={2}
              value={lcp.invoiceNotice}
              onChange={(e) => updateLacakField("invoiceNotice", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* CREATE / EDIT SHIPMENT */}
      {(isCreatingNew || editingResi) && (
        <div className="rounded-2xl border-2 border-gold/40 bg-card p-6 shadow-elegant space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">
              {isCreatingNew ? "Tambah Resi Paket Baru" : `Edit Resi: ${editingResi}`}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setEditingResi(null);
              }}
              className="text-xs font-bold text-muted-foreground hover:underline"
            >
              Batal
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Nomor Resi
              </label>
              <input
                value={formResi}
                disabled={!isCreatingNew}
                onChange={(e) => setFormResi(e.target.value.toUpperCase())}
                placeholder="Misal: AJH-1025"
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 font-mono text-sm font-bold uppercase outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Nama Penerima / Pengirim
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Misal: Yohanes Kogoya"
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Layanan</label>
              <select
                value={formService}
                onChange={(e) => setFormService(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold outline-none"
              >
                <option value="Jastip Hemat">Jastip Hemat</option>
                <option value="Jastip Pesawat">Jastip Pesawat</option>
                <option value="Jastip Kargo">Jastip Kargo</option>
                <option value="Jastip Pelni">Jastip Pelni</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Rute</label>
              <input
                value={formRoute}
                onChange={(e) => setFormRoute(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Tahap / Status
              </label>
              <select
                value={formStage}
                onChange={(e) => setFormStage(e.target.value as "diterima" | "perjalanan" | "tiba")}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="diterima">Baru Diterima di Gudang</option>
                <option value="perjalanan">Dalam Perjalanan / Kapal / Udara</option>
                <option value="tiba">Tiba di Manokwari (Siap Diambil)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Berat / Volume
              </label>
              <input
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                placeholder="Misal: 8 kg atau 2 M³"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Total Ongkir (Rp)
              </label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Status Teks Singkat
              </label>
              <input
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                placeholder="Misal: Siap Diambil di Gudang SP 4"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Waktu Terakhir Diperbarui
              </label>
              <input
                value={formUpdated}
                onChange={(e) => setFormUpdated(e.target.value)}
                placeholder="Misal: 6 Nov 2026, 14.30 WIT"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Tambah Catatan Timeline Perjalanan (Opsional)
              </label>
              <input
                value={formTimelineNote}
                onChange={(e) => setFormTimelineNote(e.target.value)}
                placeholder="Misal: Paket dimuat ke Kapal Pelni di Surabaya"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setEditingResi(null);
              }}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-deep"
            >
              Simpan Data Paket
            </button>
          </div>
        </div>
      )}

      {/* DATABASE RESI TABLE */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor resi atau nama konsumen..."
            className="w-full bg-transparent text-xs outline-none"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2.5 font-bold">No. Resi</th>
                <th className="py-2.5 font-bold">Nama</th>
                <th className="py-2.5 font-bold">Layanan</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold">Ongkir</th>
                <th className="py-2.5 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredShipments.map((s) => (
                <tr key={s.resi} className="hover:bg-muted/40">
                  <td className="py-3 font-mono font-bold text-primary">{s.resi}</td>
                  <td className="py-3 font-semibold">{s.name}</td>
                  <td className="py-3 text-muted-foreground">{s.service}</td>
                  <td className="py-3">
                    <span
                      className={
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold " +
                        (s.stage === "tiba"
                          ? "bg-accent text-accent-foreground"
                          : s.stage === "perjalanan"
                            ? "bg-secondary text-primary-deep"
                            : "bg-muted text-muted-foreground")
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 font-extrabold text-foreground">{formatRupiah(s.price)}</td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="font-bold text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus resi ${s.resi}?`)) {
                          deleteShipment(s.resi);
                          toast.info(`Resi ${s.resi} dihapus`);
                        }
                      }}
                      className="font-semibold text-destructive hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAVE FOOTER */}
      <TabSaveFooter
        pageName="Halaman Lacak Paket & Resi"
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onSave={() => onSave?.()}
        onReset={discardDraft}
      />
    </div>
  );
}

/* ================= 4. KONTAK PAGE CMS PANEL ================= */

function KontakPageCMSPanel({ onSave }: { onSave?: () => void }) {
  const { draftData, updateDraft, isSaving, hasUnsavedChanges, lastSavedAt, discardDraft } =
    useCMS();
  const kp = draftData.kontakPage || {
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

  const updateKontakField = (key: keyof typeof kp, val: string) => {
    updateDraft((prev) => ({
      ...prev,
      kontakPage: {
        ...prev.kontakPage,
        [key]: val,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Halaman Kontak (/kontak)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola judul header kontak, deskripsi 3 kartu utama, dan 2 kotak informasi di bawah.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">Header Halaman Kontak</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Badge Header
            </label>
            <input
              value={kp.headerBadge}
              onChange={(e) => updateKontakField("headerBadge", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul Utama Header
            </label>
            <input
              value={kp.headerTitle}
              onChange={(e) => updateKontakField("headerTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Deskripsi Header
          </label>
          <textarea
            rows={2}
            value={kp.headerDescription}
            onChange={(e) => updateKontakField("headerDescription", e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">3 Kotak Informasi Utama</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul Kotak 1
            </label>
            <input
              value={kp.warehouseCardTitle}
              onChange={(e) => updateKontakField("warehouseCardTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul Kotak 2
            </label>
            <input
              value={kp.hoursCardTitle}
              onChange={(e) => updateKontakField("hoursCardTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Judul Kotak 3 (WA)
            </label>
            <input
              value={kp.waCardTitle}
              onChange={(e) => updateKontakField("waCardTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-extrabold">2 Kotak Informasi Tambahan Bawah</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border bg-background p-4">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Kotak Kiri: Judul
            </label>
            <input
              value={kp.infoBox1Title}
              onChange={(e) => updateKontakField("infoBox1Title", e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
            />
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Kotak Kiri: Isi Teks
            </label>
            <textarea
              rows={3}
              value={kp.infoBox1Text}
              onChange={(e) => updateKontakField("infoBox1Text", e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-background p-4">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Kotak Kanan: Judul
            </label>
            <input
              value={kp.infoBox2Title}
              onChange={(e) => updateKontakField("infoBox2Title", e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
            />
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Kotak Kanan: Isi Teks
            </label>
            <textarea
              rows={3}
              value={kp.infoBox2Text}
              onChange={(e) => updateKontakField("infoBox2Text", e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* FOTO GUDANG & KANTOR MANOKWARI */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-foreground">Foto Gudang & Lokasi Fisik</h2>
        <ImageUploaderControl
          label="Foto Gudang Transit Manokwari"
          description="Foto fisik gudang transit atau kantor Jastip Anggun Jaya di Manokwari yang ditampilkan pada kartu kontak."
          value={kp.warehouseImage}
          defaultValue="https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=1200&q=80"
          aspectRatio="4/3"
          filterCategory="gudang"
          onChange={(val) => updateKontakField("warehouseImage", val)}
        />
      </div>

      {/* SAVE FOOTER */}
      <TabSaveFooter
        pageName="Halaman Kontak & Lokasi"
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onSave={() => onSave?.()}
        onReset={discardDraft}
      />
    </div>
  );
}

/* ================= 5. GLOBAL BRAND & SITE INFO ================= */

function GlobalBrandCMSPanel({ onSave }: { onSave?: () => void }) {
  const { draftData, updateDraft, isSaving, hasUnsavedChanges, lastSavedAt, discardDraft } =
    useCMS();
  const site = draftData.site;

  const handleChange = (key: keyof typeof site, value: string) => {
    updateDraft((prev) => ({
      ...prev,
      site: {
        ...prev.site,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Header, Footer & Identitas Brand</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi ini tampil di seluruh header, footer website, tombol WhatsApp mengambang, serta
          meta branding.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Nama Brand</label>
          <input
            value={site.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Tagline Utama</label>
          <input
            value={site.tagline}
            onChange={(e) => handleChange("tagline", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Rute Kota</label>
          <input
            value={site.cities}
            onChange={(e) => handleChange("cities", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Nomor WhatsApp Admin (kode negara misal 62)
            </label>
            <input
              value={site.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="Contoh: 6281234567890"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Jam Layanan</label>
            <input
              value={site.hours}
              onChange={(e) => handleChange("hours", e.target.value)}
              placeholder="Contoh: Senin – Sabtu, 08.00 – 20.00 WIT"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Alamat Gudang Manokwari
          </label>
          <textarea
            rows={2}
            value={site.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Template Pesan WhatsApp Otomatis
          </label>
          <textarea
            rows={2}
            value={site.waMessage}
            onChange={(e) => handleChange("waMessage", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Teks Hak Cipta Footer
          </label>
          <input
            value={site.footerCopyright || ""}
            onChange={(e) => handleChange("footerCopyright", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* PENGATURAN LOGO BRAND */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-foreground">Logo Brand Website</h2>
        <ImageUploaderControl
          label="Logo Resmi (Header Navbar & Footer)"
          description="Logo resmi perusahaan yang tampil pada bagian navigasi atas dan footer."
          value={site.logoUrl}
          defaultValue={logo.url}
          aspectRatio="1/1"
          onChange={(val) => handleChange("logoUrl", val)}
        />
      </div>

      {/* SAVE FOOTER */}
      <TabSaveFooter
        pageName="Header, Footer & Brand"
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onSave={() => onSave?.()}
        onReset={discardDraft}
      />
    </div>
  );
}

/* ================= FULLWIDTH SPLIT LOGIN SCREEN ================= */

function AdminLoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@jastipanggunjaya.com");
  const [password, setPassword] = useState("adminanggunjaya2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email dan kata sandi wajib diisi");
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success("Berhasil masuk ke Dashboard Admin!");
    } else {
      setError(result.error || "Email atau kata sandi tidak sesuai.");
    }
  };

  const fillDefaultCredentials = () => {
    setEmail("admin@jastipanggunjaya.com");
    setPassword("adminanggunjaya2026");
    setError(null);
    toast.info("Kredensial default dari .env terisi.");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* LEFT PANEL: VISUAL HERO BRANDING (50% ON DESKTOP) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-red p-12 text-primary-foreground lg:flex">
        {/* Background photo with overlay */}
        <img
          src={heroImg}
          alt="Jastip Anggun Jaya Logistics"
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/90 to-primary-deep/60" />

        {/* Ambient glow */}
        <div className="absolute -left-20 -top-20 size-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-96 rounded-full bg-gold/15 blur-3xl" />

        {/* Brand Top */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src={logo.url}
              alt="Logo Jastip Anggun Jaya"
              className="size-14 rounded-2xl bg-white/10 p-1.5 shadow-elegant backdrop-blur-sm ring-1 ring-gold/40"
            />
            <div>
              <span className="block text-xl font-extrabold tracking-tight">
                Jastip <span className="text-gradient-gold">Anggun Jaya</span>
              </span>
              <span className="text-xs font-semibold text-primary-foreground/75">
                Jakarta • Surabaya • Makassar → Manokwari, Papua
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Highlights */}
        <div className="relative z-10 my-auto max-w-lg py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gold backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Portal Dashboard Admin
          </span>
          <h2 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight">
            Pusat Kendali Seluruh Konten & Pelacakan Paket
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
            Kelola teks dan tarif di semua halaman publik secara real-time, pantau nomor resi paket
            konsumen, dan lihat perubahan seketika melalui Live Preview.
          </p>

          <div className="mt-8 space-y-3.5">
            {[
              "CMS seluruh halaman: Beranda, Layanan & Tarif, Lacak Paket, Kontak",
              "Update nomor resi & timeline checkpoint pengiriman ke Papua",
              "Simulasi multi-device preview (Desktop, Tablet, dan Smartphone)",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-soft text-accent-foreground font-bold">
                  ✓
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/70">
          <span>© {new Date().getFullYear()} Jastip Anggun Jaya. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gold">
            <ShieldCheck className="size-3.5" /> .env Session Auth
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: FULLWIDTH FULLHEIGHT LOGIN FORM (50% ON DESKTOP, 100% ON MOBILE) */}
      <div className="flex w-full flex-col justify-between overflow-y-auto px-6 py-10 sm:px-14 md:px-20 lg:w-1/2 lg:p-16">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Kembali ke Website Utama
          </Link>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Koneksi Aman</span>
          </div>
        </div>

        {/* Center Form Container (NOT A CARD, FULL FLOW) */}
        <div className="my-auto w-full max-w-md py-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src={logo.url} alt="Logo" className="size-12 rounded-xl bg-card p-1 shadow-sm" />
            <div>
              <h3 className="font-extrabold text-foreground">Jastip Anggun Jaya</h3>
              <p className="text-xs text-muted-foreground">Dashboard Admin</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Login Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Masukkan email dan kata sandi admin Anda untuk mengakses dan mengelola seluruh konten
            website.
          </p>

          <div className="gold-rule mt-4 w-16" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Admin
              </label>
              <div className="relative mt-2 flex items-center">
                <User className="absolute left-4 size-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jastipanggunjaya.com"
                  required
                  className="w-full rounded-2xl border border-input bg-card py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Kata Sandi
                </label>
              </div>
              <div className="relative mt-2 flex items-center">
                <Lock className="absolute left-4 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-2xl border border-input bg-card py-3.5 pl-11 pr-11 text-sm font-semibold outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 text-muted-foreground hover:text-foreground"
                  title={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elegant transition-all hover:bg-primary-deep hover:shadow-lg disabled:opacity-50"
            >
              <KeyRound className="size-4" />
              <span>{isLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
            </button>

            {/* Quick Fill Default Button */}
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>Isi Otomatis Kredensial (.env)</span>
            </button>
          </form>
        </div>

        {/* Bottom Helper */}
        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          <p>
            Kredensial disimpan pada file{" "}
            <code className="font-mono text-foreground font-bold">.env</code> server.
          </p>
        </div>
      </div>
    </div>
  );
}
