// Data demo pelacakan paket (frontend saja).
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
  customerName: string | null;
  packageNumber: string | null;
  packageDate: string | null;
  lastUpdated: string | null;
  serviceType: string | null;
  route: string | null;
  lastLocation: string | null;
  realWeight: string | null;
  volumeWeight: string | null;
  billableWeight: string | null;
  totalShipping: string | null;
  arrivedAtDestination: boolean;
  pickedUp: boolean;
  status: string;
};
