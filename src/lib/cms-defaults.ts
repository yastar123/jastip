import { type AppCMSData } from "./cms-types";
import { SERVICES } from "./services";
import { SITE, SITE_LOGO_URL } from "./site";

export const DEFAULT_CMS_DATA: AppCMSData = {
  site: {
    name: SITE.name,
    tagline: SITE.tagline,
    logoUrl: SITE_LOGO_URL,
    cities: SITE.cities,
    address: SITE.address,
    whatsapp: SITE.whatsapp,
    hours: SITE.hours,
    waMessage: SITE.waMessage,
    footerCopyright: `© ${new Date().getFullYear()} Jastip Anggun Jaya. Seluruh hak cipta dilindungi.`,
  },
  home: {
    hero: {
      badge: "Jakarta • Surabaya • Makassar → Manokwari",
      titlePrefix: "Jastip & Pengiriman",
      titleHighlight: "Paket & Kendaraan",
      titleSuffix: "ke Papua",
      description:
        "Jastip Anggun Jaya mengantar paket Anda dengan aman — pilih layanan tercepat atau yang paling hemat, dan pantau perjalanannya langsung dari sini.",
      trackButtonText: "Lacak Paket Saya",
      contactButtonText: "Hubungi Admin",
      stats: [
        { number: "4", label: "Pilihan Layanan" },
        { number: "3", label: "Kota Asal" },
        { number: "1", label: "Tujuan: Manokwari" },
      ],
    },
    gallerySlides: [],
    steps: [
      {
        no: "01",
        title: "Kirim & Registrasi",
        text: "Bawa atau kirim paket Anda ke gudang kami di Jakarta atau Surabaya, lalu admin mencatat data pengiriman.",
      },
      {
        no: "02",
        title: "Proses & Barcode",
        text: "Paket diproses sesuai layanan pilihan Anda — setiap paket kargo mendapat barcode sendiri.",
      },
      {
        no: "03",
        title: "Tiba di Manokwari",
        text: "Pantau perjalanan paket lewat halaman Lacak Paket, lalu ambil di gudang kami di Manokwari.",
      },
    ],
    features: [
      {
        iconName: "ShieldCheck",
        title: "Aman & Terpercaya",
        text: "Paket ditangani langsung oleh tim berpengalaman, dari gudang asal sampai Manokwari.",
      },
      {
        iconName: "Wallet",
        title: "Tarif Transparan",
        text: "Daftar tarif jelas per layanan — flat, bracket, maupun berjenjang. Tanpa biaya tersembunyi.",
      },
      {
        iconName: "ScanBarcode",
        title: "Bisa Dilacak",
        text: "Cek status paket kapan saja cukup dengan nomor resi — tanpa perlu telepon.",
      },
      {
        iconName: "Headset",
        title: "Admin Siap Membantu",
        text: "Ada pertanyaan soal tarif atau paket? Tombol Hubungi Admin selalu tersedia.",
      },
    ],
    cta: {
      title: "Sudah titip paket? Lacak sekarang",
      text: "Cukup masukkan nomor resi — status dan detail paket Anda langsung tampil.",
      buttonText: "Lacak Paket Sekarang",
    },
    citiesReach: ["Jakarta", "Surabaya", "Makassar"],
  },
  layananPage: {
    headerBadge: "Layanan & Tarif",
    headerTitle: "Empat pilihan layanan ke Manokwari",
    headerDescription:
      "Semua tarif di bawah ini transparan dan resmi — pilih sesuai kebutuhan kecepatan, berat, dan volume paket Anda.",
    ctaTitle: "Belum yakin pilih yang mana?",
    ctaDescription:
      "Konsultasikan kebutuhan pengiriman Anda dengan admin — kami bantu pilihkan layanan yang paling hemat dan cepat.",
    ctaButtonText: "Hubungi Admin",
  },
  lacakPage: {
    headerBadge: "Lacak Paket",
    headerTitle: "Cek posisi paket Anda di sini",
    headerDescription:
      "Cari seluruh paket berdasarkan nama konsumen, atau cek detail satu paket menggunakan nomor resi.",
    cardDisclaimer:
      "Cari Nama menampilkan semua paket yang cocok. Paket yang sudah tiba menampilkan nama, berat, ongkir, dan status pengambilan.",
    demoBoxTitle: "Pelacakan Paket",
    demoBoxDescription: "Masukkan nama konsumen atau nomor resi untuk melihat status paket.",
    invoiceNotice: "Status pengambilan diperbarui oleh admin gudang Manokwari.",
    emptyNoticeTitle: "Belum ada paket ditampilkan",
    emptyNoticeText: "Pilih metode pencarian, lalu masukkan nama konsumen atau nomor resi.",
  },
  kontakPage: {
    headerBadge: "Kontak",
    headerTitle: "Kami siap membantu Anda",
    headerDescription:
      "Tanya tarif, jadwal keberangkatan, atau kondisi paket — admin kami membalas dengan cepat melalui WhatsApp.",
    warehouseCardTitle: "Alamat Gudang",
    hoursCardTitle: "Jam Layanan",
    waCardTitle: "WhatsApp Admin",
    waCardDesc: "Klik tombol di bawah untuk chat langsung dengan admin kami.",
    infoBox1Title: "Data Paket Dikelola Admin",
    infoBox1Text:
      "Data paket dan status pengiriman saat ini dikelola langsung oleh admin dan diperbarui berkala melalui Dashboard, sehingga hasil pelacakan di website selalu sesuai catatan resmi.",
    infoBox2Title: "Sudah punya nomor resi?",
    infoBox2Text:
      "Cek status dan detail paket Anda sendiri — cukup nomor resi, tanpa perlu menghubungi admin.",
    infoBox2ButtonText: "Lacak Paket Sekarang",
  },
  services: SERVICES,
  shipments: [],
};
