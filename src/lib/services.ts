// Data layanan & tarif — bersumber dari daftar tarif Jastip Anggun Jaya.
export type PriceRow = { label: string; price: number; note?: string };
export type PricingTable = { title?: string; columns: [string, string]; rows: PriceRow[] };

export type Service = {
  id: string;
  name: string;
  route: string;
  mode: string;
  unit: string;
  tagline: string;
  startingFrom: number;
  options: string[];
  highlights: string[];
  tables: PricingTable[];
  notes: string[];
  image?: string;
};

export const SERVICES: Service[] = [
  {
    id: "hemat",
    name: "Jastip Hemat",
    route: "Surabaya → Manokwari",
    mode: "Flat / kg",
    unit: "per kg",
    tagline: "Tarif flat yang hemat untuk paket harian — semakin berat, tetap mudah dihitung.",
    startingFrom: 10000,
    options: ["1 Paket", "Grup Paket"],
    highlights: [
      "Tarif flat Rp 10.000/kg",
      "Cocok untuk paket rutin",
      "Penghitungan sederhana & transparan",
    ],
    tables: [
      {
        columns: ["Berat Paket", "Ongkir"],
        rows: [
          { label: "1 kg", price: 10000 },
          { label: "5 kg", price: 50000 },
          { label: "10 kg", price: 100000 },
          { label: "20 kg", price: 200000 },
        ],
      },
    ],
    notes: ["Berat lainnya = berat × Rp 10.000."],
  },
  {
    id: "pesawat",
    name: "Jastip Pesawat",
    route: "Jakarta → Manokwari",
    mode: "Bracket per berat",
    unit: "per paket",
    tagline: "Lebih cepat lewat jalur udara — tarif bertingkat sesuai berat paket.",
    startingFrom: 15800,
    options: ["1 Paket", "Grup Paket"],
    highlights: [
      "Jalur udara, lebih cepat",
      "Tarif bracket sesuai berat",
      "Cocok untuk dokumen & paket kecil",
    ],
    tables: [
      {
        columns: ["Berat Paket", "Ongkir"],
        rows: [
          { label: "1 – 200 gram", price: 15800 },
          { label: "201 – 400 gram", price: 30800 },
          { label: "401 – 500 gram", price: 38500 },
          { label: "600 gram", price: 46200 },
          { label: "700 gram", price: 53900 },
          { label: "800 gram", price: 61600 },
          { label: "900 gram", price: 69300 },
          { label: "1 kg", price: 77000 },
          { label: "2 kg", price: 154000 },
          { label: "3 kg", price: 231000 },
          { label: "5 kg", price: 385000 },
          { label: "10 kg", price: 770000 },
        ],
      },
    ],
    notes: [],
  },
  {
    id: "kargo",
    name: "Jastip Kargo",
    route: "Jakarta / Surabaya → Manokwari",
    mode: "Flat per M³ / Ton",
    unit: "per M³ / Ton",
    tagline: "Paling hemat untuk paket besar — kirim dalam volume besar tanpa minimum.",
    startingFrom: 7000,
    options: ["Tanpa minimum", "Barcode per paket"],
    highlights: [
      "Hemat untuk paket besar",
      "Tanpa minimum volume",
      "Setiap paket cargo memiliki barcode sendiri",
    ],
    tables: [
      {
        columns: ["Berat Paket", "Ongkir"],
        rows: [
          { label: "1 M³ / Ton", price: 7000 },
          { label: "5 M³ / Ton", price: 35000 },
          { label: "10 M³ / Ton", price: 70000 },
          { label: "20 M³ / Ton", price: 140000 },
        ],
      },
    ],
    notes: ["Berat lainnya = berat × Rp 7.000."],
  },
  {
    id: "pelni",
    name: "Jastip Pelni",
    route: "Jakarta / Surabaya → Manokwari",
    mode: "Berjenjang per kg",
    unit: "per kg",
    tagline: "Laut reguler tarif berjenjang — semakin banyak kilo, semakin murah per kilonya.",
    startingFrom: 15500,
    options: ["1 Paket", "Grup Paket"],
    highlights: [
      "Tarif berjenjang per kg",
      "Semakin berat, tarif per kg turun",
      "Cocok kiriman rutin dalam jumlah banyak",
    ],
    tables: [
      {
        title: "Jakarta → Manokwari",
        columns: ["Berat", "Tarif / kg"],
        rows: [
          { label: "1 – 10 kg", price: 20000, note: "1 kg = Rp 20.000" },
          { label: "11 – 20 kg", price: 19000, note: "11 kg = Rp 209.000" },
          { label: "21 – 40 kg", price: 18000, note: "21 kg = Rp 378.000" },
          { label: "41 – 80 kg", price: 17000, note: "41 kg = Rp 697.000" },
        ],
      },
      {
        title: "Surabaya → Manokwari",
        columns: ["Berat", "Tarif / kg"],
        rows: [
          { label: "1 – 10 kg", price: 18000, note: "1 kg = Rp 18.000" },
          { label: "11 – 20 kg", price: 17000, note: "11 kg = Rp 187.000" },
          { label: "21 – 40 kg", price: 16000, note: "21 kg = Rp 336.000" },
          { label: "41 – 80 kg", price: 15500, note: "41 kg = Rp 635.500" },
        ],
      },
    ],
    notes: [],
  },
];
