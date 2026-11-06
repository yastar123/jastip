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

export type PublicTrackingResult = {
  resi: string;
  packageNumber: string | null;
  packageDate: string | null;
  serviceType: string | null;
  route: string | null;
  realWeight: string | null;
  volumeWeight: string | null;
  billableWeight: string | null;
  additionalFeeDescription: string | null;
  status: string;
};
