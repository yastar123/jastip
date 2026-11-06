export interface PresetImage {
  id: string;
  title: string;
  category: "kapal" | "kontainer" | "pesawat" | "gudang" | "truk" | "paket";
  url: string;
  description: string;
}

export const PRESET_LOGISTICS_IMAGES: PresetImage[] = [
  {
    id: "preset-kapal-pelni",
    title: "Kapal Kargo & Pelni",
    category: "kapal",
    url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1400&q=80",
    description: "Kapal kargo dan penumpang melintasi perairan Indonesia Timur.",
  },
  {
    id: "preset-dermaga-kontainer",
    title: "Dermaga & Peti Kemas",
    category: "kontainer",
    url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1400&q=80",
    description: "Aktivitas bongkar muat kontainer peti kemas di dermaga pelabuhan.",
  },
  {
    id: "preset-pesawat-kargo",
    title: "Pesawat Udara Logistik",
    category: "pesawat",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1400&q=80",
    description: "Pesawat kargo siap lepas landas untuk pengiriman udara ekspres.",
  },
  {
    id: "preset-tumpukan-kontainer",
    title: "Depo Kontainer Ekspedisi",
    category: "kontainer",
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80",
    description: "Tumpukan kontainer siap kirim ke pelabuhan Manokwari.",
  },
  {
    id: "preset-gudang-transit",
    title: "Gudang Transit Modern",
    category: "gudang",
    url: "https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=1400&q=80",
    description: "Ruang penyimpanan dan sortir paket aman berstandar rapi.",
  },
  {
    id: "preset-truk-box",
    title: "Armada Truk Ekspedisi",
    category: "truk",
    url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1400&q=80",
    description: "Armada angkut darat untuk jemput dan antar paket ke gudang.",
  },
  {
    id: "preset-paket-kardus",
    title: "Paket & Kardus Jastip",
    category: "paket",
    url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1400&q=80",
    description: "Paket barang dan oleh-oleh dikemas rapi terlindungi rapi.",
  },
  {
    id: "preset-gudang-palet",
    title: "Gudang & Forklift Kargo",
    category: "gudang",
    url: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80",
    description: "Penanganan kargo skala besar dan alat berat.",
  },
];

/**
 * Reads an image File from user's device, resizes it if needed to keep payload small,
 * and converts it to a Data URL (base64 string).
 */
export async function readFileAsCompressedDataUrl(
  file: File,
  maxWidth = 1400,
  maxHeight = 1000,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or small file, return direct read
    if (file.type === "image/svg+xml" || file.size < 120_000) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to uncompressed
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background for transparencies converted to jpeg
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve(dataUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar"));
      img.src = e.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
