import { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Link2,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  PRESET_LOGISTICS_IMAGES,
  readFileAsCompressedDataUrl,
  type PresetImage,
} from "@/lib/cms-images";
import { toast } from "sonner";

interface ImageUploaderControlProps {
  label: string;
  description?: string;
  value?: string | undefined;
  defaultValue?: string | undefined;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "21/9";
  onChange: (newValue: string) => void;
  filterCategory?: PresetImage["category"];
}

export function ImageUploaderControl({
  label,
  description,
  value,
  defaultValue,
  aspectRatio = "16/9",
  onChange,
  filterCategory,
}: ImageUploaderControlProps) {
  const [urlInput, setUrlInput] = useState(value || "");
  const [showPresets, setShowPresets] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImage = value || defaultValue;

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    toast.success(`Gambar "${label}" berhasil diperbarui dari URL`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      toast.loading("Memproses dan mengoptimalkan gambar...", { id: "img-upload" });
      const dataUrl = await readFileAsCompressedDataUrl(file);
      onChange(dataUrl);
      setUrlInput("");
      toast.success(`Gambar "${label}" berhasil diunggah!`, { id: "img-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal memproses gambar. Pastikan format JPG, PNG, atau WebP.", {
        id: "img-upload",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSelectPreset = (preset: PresetImage) => {
    onChange(preset.url);
    setUrlInput(preset.url);
    toast.success(`Preset "${preset.title}" diterapkan untuk ${label}!`);
  };

  const handleReset = () => {
    if (defaultValue) {
      onChange(defaultValue);
      setUrlInput(defaultValue);
      toast.info(`Gambar "${label}" dikembalikan ke default bawaan.`);
    } else {
      onChange("");
      setUrlInput("");
      toast.info(`Gambar "${label}" dikosongkan.`);
    }
  };

  const aspectClass =
    aspectRatio === "1/1"
      ? "aspect-square"
      : aspectRatio === "4/3"
        ? "aspect-[4/3]"
        : aspectRatio === "21/9"
          ? "aspect-[21/9]"
          : "aspect-video";

  const presetsToDisplay = filterCategory
    ? PRESET_LOGISTICS_IMAGES.filter((p) => p.category === filterCategory)
    : PRESET_LOGISTICS_IMAGES;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label className="text-sm font-extrabold text-foreground">{label}</label>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {defaultValue && value && value !== defaultValue && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground transition-colors hover:text-destructive"
            title="Kembalikan ke gambar default"
          >
            <RotateCcw className="size-3" />
            Reset ke Default
          </button>
        )}
      </div>

      {/* PREVIEW + CONTROLS GRID */}
      <div className="mt-4 grid gap-5 sm:grid-cols-12">
        {/* Preview Frame */}
        <div className="sm:col-span-5">
          <div
            className={`relative w-full overflow-hidden rounded-xl border border-border bg-muted/60 ${aspectClass}`}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt={label}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                <ImageIcon className="size-8 opacity-40" />
                <span className="mt-1 text-xs font-semibold">Belum ada gambar</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-sm">
              {aspectRatio}
            </div>
          </div>
        </div>

        {/* Input & Action buttons */}
        <div className="flex flex-col justify-between space-y-3 sm:col-span-7">
          {/* File Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              <Upload className="size-4" />
              <span>{isProcessing ? "Memproses..." : "Upload File dari Komputer / HP"}</span>
            </button>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mendukung PNG, JPG, WebP. Otomatis dikompres & disimpan ke database.
            </p>
          </div>

          {/* Direct URL input */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground">
              Atau Masukkan URL Gambar:
            </label>
            <div className="mt-1 flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Check className="size-3.5" />
                Terapkan
              </button>
            </div>
          </div>

          {/* Toggle Preset Drawer */}
          <div>
            <button
              type="button"
              onClick={() => setShowPresets((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-gold-deep transition-colors hover:underline"
            >
              <Sparkles className="size-3.5" />
              <span>Pilih dari Foto Preset Logistik ({presetsToDisplay.length} foto)</span>
              {showPresets ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PRESET GALLERY EXPANDABLE */}
      {showPresets && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-xs font-extrabold text-foreground">
            Koleksi Foto Ekspedisi & Logistik Berkualitas Tinggi:
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presetsToDisplay.map((preset) => {
              const isSelected = activeImage === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative overflow-hidden rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-gold hover:shadow-sm"
                  }`}
                >
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="bg-card p-1.5">
                    <p className="truncate text-[11px] font-bold">{preset.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {preset.category}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground shadow">
                      <Check className="size-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
