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

export const DEMO_SHIPMENTS: Shipment[] = [
  {
    resi: "AJH-1024",
    name: "Budi Santoso",
    service: "Jastip Hemat",
    route: "Surabaya → Manokwari",
    weight: "8 kg",
    price: 80000,
    status: "Tiba di Manokwari — Siap Diambil",
    stage: "tiba",
    updated: "3 Nov 2026, 09.30 WIT",
    timeline: [
      { time: "27 Okt 2026, 10.15 WIB", place: "Surabaya", note: "Paket diterima di gudang Surabaya" },
      { time: "29 Okt 2026, 16.40 WIB", place: "Surabaya", note: "Paket dimuat ke kapal" },
      { time: "2 Nov 2026, 07.05 WIT", place: "Manokwari", note: "Paket tiba di gudang Manokwari" },
      { time: "3 Nov 2026, 09.30 WIT", place: "Manokwari", note: "Siap diambil oleh penerima" },
    ],
  },
  {
    resi: "AJP-2041",
    name: "Maria Wenda",
    service: "Jastip Pesawat",
    route: "Jakarta → Manokwari",
    weight: "1 kg",
    price: 77000,
    status: "Dalam Perjalanan",
    stage: "perjalanan",
    updated: "3 Nov 2026, 20.10 WIB",
    timeline: [
      { time: "31 Okt 2026, 13.20 WIB", place: "Jakarta", note: "Paket diterima di gudang Jakarta" },
      { time: "1 Nov 2026, 08.00 WIB", place: "Jakarta", note: "Paket dikirim via pesawat" },
      { time: "3 Nov 2026, 20.10 WIB", place: "Transit", note: "Paket dalam perjalanan menuju Manokwari" },
    ],
  },
  {
    resi: "AJK-3077",
    name: "Yohanes Kambu",
    service: "Jastip Kargo",
    route: "Jakarta → Manokwari",
    weight: "3 M³",
    price: 21000,
    status: "Diterima di Gudang Jakarta",
    stage: "diterima",
    updated: "4 Nov 2026, 11.45 WIB",
    timeline: [
      { time: "4 Nov 2026, 11.45 WIB", place: "Jakarta", note: "Paket diterima & barcode AJK-3077 terpasang" },
    ],
  },
  {
    resi: "AJPL-4112",
    name: "Selpi Ondek",
    service: "Jastip Pelni",
    route: "Surabaya → Manokwari",
    weight: "15 kg",
    price: 255000,
    status: "Tiba di Manokwari — Siap Diambil",
    stage: "tiba",
    updated: "2 Nov 2026, 14.20 WIT",
    timeline: [
      { time: "24 Okt 2026, 09.00 WIB", place: "Surabaya", note: "Paket diterima di gudang Surabaya" },
      { time: "26 Okt 2026, 06.30 WIB", place: "Surabaya", note: "Paket berangkat via kapal Pelni" },
      { time: "1 Nov 2026, 10.10 WIT", place: "Manokwari", note: "Paket tiba di gudang Manokwari" },
      { time: "2 Nov 2026, 14.20 WIT", place: "Manokwari", note: "Siap diambil oleh penerima" },
    ],
  },
];

export function findShipment(resi: string, name: string): Shipment | null {
  const r = resi.trim().toUpperCase();
  const n = name.trim().toLowerCase();
  if (!r || !n) return null;
  return (
    DEMO_SHIPMENTS.find(
      (s) => s.resi.toUpperCase() === r && s.name.toLowerCase() === n,
    ) ?? null
  );
}
