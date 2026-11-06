import { Image as ImageIcon, Sparkles } from "lucide-react";
import { useCMS } from "@/lib/cms-context";
import { ImageUploaderControl } from "./image-uploader-control";
import { TabSaveFooter } from "./save-bars";
import heroImg from "@/assets/hero.jpg";
import portImg from "@/assets/port.jpg";
import logoAsset from "@/assets/logo.png.asset.json";

export function MediaCMSPanel({ onSave }: { onSave: () => void }) {
  const { draftData, updateDraft, isSaving, hasUnsavedChanges, lastSavedAt, discardDraft } =
    useCMS();
  const home = draftData.home;
  const site = draftData.site;
  const services = draftData.services;
  const kp = draftData.kontakPage;

  const handleUpdateHomeImage = (key: "heroImage" | "portImage", value: string) => {
    updateDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        [key]: value,
      },
    }));
  };

  const handleUpdateLogo = (value: string) => {
    updateDraft((prev) => ({
      ...prev,
      site: {
        ...prev.site,
        logoUrl: value,
      },
    }));
  };

  const handleUpdateWarehouseImage = (value: string) => {
    updateDraft((prev) => ({
      ...prev,
      kontakPage: {
        ...prev.kontakPage,
        warehouseImage: value,
      },
    }));
  };

  const handleUpdateServiceImage = (serviceId: string, value: string) => {
    updateDraft((prev) => {
      const updated = prev.services.map((s) => (s.id === serviceId ? { ...s, image: value } : s));
      return {
        ...prev,
        services: updated,
      };
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-red text-primary-foreground shadow-sm">
            <ImageIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Galeri & Manajemen Gambar Website
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Kelola seluruh gambar publik di website: Hero Beranda, Pelabuhan, Gudang, Logo Brand,
              dan Armada Layanan.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-gold-soft/50 p-3 text-xs font-semibold text-accent-foreground">
          <Sparkles className="size-4 shrink-0 text-gold-deep" />
          <span>
            Setiap gambar dapat diunggah langsung dari perangkat Anda (JPG/PNG/WebP), dimasukkan via
            link URL, atau dipilih dari foto logistik resolusi tinggi yang telah kami sediakan.
          </span>
        </div>
      </div>

      {/* SECTION 1: GAMBAR BERANDA */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground">1. Gambar Halaman Beranda (/)</h2>

        <ImageUploaderControl
          label="Gambar Hero Banner (Latar Belakang Utama)"
          description="Tampil di bagian paling atas halaman Beranda sebagai latar belakang headline utama dan pencarian resi."
          value={home.heroImage}
          defaultValue={heroImg}
          aspectRatio="16/9"
          filterCategory="kontainer"
          onChange={(val) => handleUpdateHomeImage("heroImage", val)}
        />

        <ImageUploaderControl
          label="Gambar Jangkauan & Pelabuhan Kargo"
          description="Tampil di seksi 'Jangkauan Kiriman' (Jakarta, Surabaya, Makassar ke Manokwari) di halaman Beranda."
          value={home.portImage}
          defaultValue={portImg}
          aspectRatio="16/9"
          filterCategory="kapal"
          onChange={(val) => handleUpdateHomeImage("portImage", val)}
        />
      </div>

      {/* SECTION 2: LOGO BRAND */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground">
          2. Logo Brand & Identitas Situs
        </h2>

        <ImageUploaderControl
          label="Logo Resmi Jastip Anggun Jaya"
          description="Tampil di navbar header utama atas dan footer bawah di seluruh halaman website."
          value={site.logoUrl}
          defaultValue={logoAsset.url}
          aspectRatio="1/1"
          onChange={handleUpdateLogo}
        />
      </div>

      {/* SECTION 3: FOTO GUDANG & KANTOR */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground">
          3. Foto Gudang & Kantor Manokwari (/kontak)
        </h2>

        <ImageUploaderControl
          label="Foto Gudang Transit & Kantor Manokwari"
          description="Tampil pada kartu informasi 'Alamat Gudang' di halaman Kontak untuk meyakinkan pelanggan."
          value={kp.warehouseImage}
          defaultValue="https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=1200&q=80"
          aspectRatio="4/3"
          filterCategory="gudang"
          onChange={handleUpdateWarehouseImage}
        />
      </div>

      {/* SECTION 4: GAMBAR ARMADA LAYANAN */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground">
          4. Foto Armada / Banner Layanan (/layanan)
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((srv) => (
            <ImageUploaderControl
              key={srv.id}
              label={`Foto Armada: ${srv.name}`}
              description={`Gambar pendukung untuk kartu layanan ${srv.name} (${srv.route}).`}
              value={srv.image}
              defaultValue={
                srv.id === "pelni"
                  ? "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80"
                  : srv.id === "pesawat"
                    ? "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80"
                    : srv.id === "kargo"
                      ? "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
                      : "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1200&q=80"
              }
              aspectRatio="16/9"
              onChange={(val) => handleUpdateServiceImage(srv.id, val)}
            />
          ))}
        </div>
      </div>

      {/* SAVE FOOTER */}
      <TabSaveFooter
        pageName="Galeri & Gambar"
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onSave={onSave}
        onReset={discardDraft}
      />
    </div>
  );
}
