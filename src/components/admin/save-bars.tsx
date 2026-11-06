import { Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

interface FloatingSaveBarProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  onSave: () => void;
  onReset: () => void;
}

export function FloatingSaveBar({
  hasUnsavedChanges,
  isSaving,
  lastSavedAt,
  onSave,
  onReset,
}: FloatingSaveBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[95%] max-w-3xl -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-md transition-all sm:px-6">
      <div className="flex items-center gap-3">
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-foreground sm:text-sm">
                Ada Perubahan Belum Disimpan
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Simpan agar langsung aktif di website publik • Tekan{" "}
                <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+S</kbd>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-foreground">Semua Perubahan Tersimpan</p>
              {lastSavedAt && (
                <p className="text-[11px] text-muted-foreground">
                  Terakhir disimpan pukul {lastSavedAt}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Batal</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold shadow-md transition-all sm:text-sm ${
            hasUnsavedChanges
              ? "bg-primary text-primary-foreground hover:bg-primary-deep hover:scale-[1.02] shadow-elegant"
              : "border border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
          }`}
        >
          <Save className="size-4" />
          <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Perubahan Sekarang"}</span>
        </button>
      </div>
    </div>
  );
}

interface TabSaveFooterProps {
  pageName: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  onSave: () => void;
  onReset?: () => void;
}

export function TabSaveFooter({
  pageName,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  onSave,
  onReset,
}: TabSaveFooterProps) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-foreground">Simpan Perubahan {pageName}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasUnsavedChanges
              ? "Terdapat draft modifikasi yang belum tersimpan di database."
              : "Semua konfigurasi pada halaman ini sudah tersimpan dan tayang di website publik."}
            {lastSavedAt && ` (Terakhir disimpan ${lastSavedAt})`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onReset && hasUnsavedChanges && (
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              <span>Batal / Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground shadow-elegant transition-all hover:bg-primary-deep hover:scale-[1.02] disabled:opacity-50 sm:text-sm"
          >
            <Save className="size-4" />
            <span>{isSaving ? "Menyimpan..." : `Simpan ${pageName}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
