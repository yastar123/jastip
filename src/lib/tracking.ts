// Data demo pelacakan paket (frontend saja).
// Nanti: data ini bisa diambil otomatis dari Google Drive milik admin.
export type TrackingEvent = {
  time: string;
  place: string;
  note: string;
};

export type Shipment = {
  resi: string;
  name: string;
  service: string;
  route: string;
  weight: string;
  price: number;
  status: string;
  stage: "diterima" | "perjalanan" | "tiba";
  updated: string;
  timeline: TrackingEvent[];
};

export const DEMO_SHIPMENTS: Shipment[] = [];

export function findShipment(resi: string, name: string): Shipment | null {
  const r = resi.trim().toUpperCase();
  const n = name.trim().toLowerCase();
  if (!r || !n) return null;
  return (
    DEMO_SHIPMENTS.find((s) => s.resi.toUpperCase() === r && s.name.toLowerCase() === n) ?? null
  );
}
