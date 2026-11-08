import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { type AppCMSData } from "./cms-types";
import { DEFAULT_CMS_DATA } from "./cms-defaults";
import { type Shipment } from "./tracking";
import { useAuth } from "./auth-context";

const STORAGE_KEY = "jastip_anggun_cms_v1";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jastip_anggun_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface DatabaseStatus {
  engine: string;
  isPostgresConnected: boolean;
  fallbackActive: boolean;
}

interface CMSContextType {
  data: AppCMSData;
  draftData: AppCMSData;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  dbStatus: DatabaseStatus | null;
  activePreviewPage: string;
  previewDevice: "desktop" | "tablet" | "mobile";
  setPreviewDevice: (device: "desktop" | "tablet" | "mobile") => void;
  setActivePreviewPage: (page: string) => void;
  updateDraft: (updater: (prev: AppCMSData) => AppCMSData) => void;
  saveChanges: () => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  discardDraft: () => void;
  addOrUpdateShipment: (shipment: Shipment) => Promise<boolean>;
  deleteShipment: (resi: string) => Promise<boolean>;
}

const CMSContext = createContext<CMSContextType | null>(null);

export function CMSProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppCMSData>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) return JSON.parse(cached) as AppCMSData;
      } catch (err) {
        console.warn("Error reading localStorage CMS data:", err);
      }
    }
    return DEFAULT_CMS_DATA;
  });

  const [draftData, setDraftData] = useState<AppCMSData>(data);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [activePreviewPage, setActivePreviewPage] = useState<string>("/");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("mobile");

  const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(draftData);

  // Sync draft whenever saved data changes from server
  const refreshFromServer = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsLoading(true);
    try {
      // Check health & DB status
      fetch("/api/health")
        .then((res) => (res.ok ? res.json() : null))
        .then((health) => {
          if (health?.database) {
            setDbStatus(health.database);
          }
        })
        .catch(() => {});

      const res = await fetch("/api/cms", { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setData(json.data);
          setDraftData(json.data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          } catch (e) {
            console.warn("Storage error", e);
          }
        }
      }
    } catch (err) {
      console.warn("Fetch CMS failed, relying on cached data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer, user]);

  const updateDraft = useCallback((updater: (prev: AppCMSData) => AppCMSData) => {
    setDraftData((prev) => updater(prev));
  }, []);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(draftData),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json?.data || draftData;
        setData(updated);
        setDraftData(updated);
        setLastSavedAt(timeStr);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("Local storage write error:", e);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Save CMS error:", err);
      // Fallback: save locally
      setData(draftData);
      setLastSavedAt(timeStr);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      } catch (e) {
        console.warn("Local storage write error:", e);
      }
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [draftData]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/cms/reset", { method: "POST", headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const resetData = json?.data || DEFAULT_CMS_DATA;
        setData(resetData);
        setDraftData(resetData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
        return true;
      }
      setData(DEFAULT_CMS_DATA);
      setDraftData(DEFAULT_CMS_DATA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CMS_DATA));
      return true;
    } catch (err) {
      console.error("Reset error:", err);
      setData(DEFAULT_CMS_DATA);
      setDraftData(DEFAULT_CMS_DATA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CMS_DATA));
      return true;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const discardDraft = useCallback(() => {
    setDraftData(data);
  }, [data]);

  const addOrUpdateShipment = useCallback(
    async (shipment: Shipment): Promise<boolean> => {
      const existingIdx = draftData.shipments.findIndex(
        (s) => s.resi.toUpperCase() === shipment.resi.toUpperCase(),
      );
      let updatedShipments: Shipment[];
      if (existingIdx >= 0) {
        updatedShipments = [...draftData.shipments];
        updatedShipments[existingIdx] = shipment;
      } else {
        updatedShipments = [shipment, ...draftData.shipments];
      }

      const nextData: AppCMSData = {
        ...draftData,
        shipments: updatedShipments,
      };

      setDraftData(nextData);

      try {
        const res = await fetch("/api/shipments", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(shipment),
        });
        if (res.ok) {
          setData(nextData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
          return true;
        }
      } catch (err) {
        console.warn("Shipment API error, saved locally:", err);
      }

      setData(nextData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      return true;
    },
    [draftData],
  );

  const deleteShipment = useCallback(
    async (resi: string): Promise<boolean> => {
      const filtered = draftData.shipments.filter(
        (s) => s.resi.toUpperCase() !== resi.toUpperCase(),
      );
      const nextData: AppCMSData = {
        ...draftData,
        shipments: filtered,
      };
      setDraftData(nextData);

      try {
        await fetch(`/api/shipments/${encodeURIComponent(resi)}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      } catch (err) {
        console.warn("Delete shipment API error:", err);
      }

      setData(nextData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      return true;
    },
    [draftData],
  );

  return (
    <CMSContext.Provider
      value={{
        data,
        draftData,
        isLoading,
        isSaving,
        hasUnsavedChanges,
        lastSavedAt,
        dbStatus,
        activePreviewPage,
        previewDevice,
        setPreviewDevice,
        setActivePreviewPage,
        updateDraft,
        saveChanges,
        resetToDefaults,
        discardDraft,
        addOrUpdateShipment,
        deleteShipment,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const ctx = useContext(CMSContext);
  if (!ctx) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return ctx;
}
