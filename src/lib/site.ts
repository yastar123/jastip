// Informasi utama usaha — ubah di sini jika ada perubahan data.
export const SITE = {
  name: "Jastip Anggun Jaya",
  tagline: "Layanan pengiriman paket & kendaraan ke Papua",
  cities: "Jakarta • Surabaya • Makassar → Manokwari",
  address: "Jln. Merpati SP 4 JlR 8 (Depan SMKN 4), Manokwari, Papua Barat",
  // Nomor WhatsApp contoh — ganti dengan nomor admin yang sebenarnya.
  whatsapp: "6281234567890",
  // Jam layanan contoh — mohon konfirmasi jam operasional sebenarnya.
  hours: "Senin – Sabtu, 08.00 – 20.00 WIT",
  waMessage:
    "Halo Admin Jastip Anggun Jaya, saya ingin bertanya tentang layanan pengiriman paket ke Manokwari.",
};

export function waLink(message: string = SITE.waMessage): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
