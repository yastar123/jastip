import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/site";
import { useCMS } from "@/lib/cms-context";
import { type AppCMSData } from "@/lib/cms-types";

// Tombol mengambang "Hubungi Admin" via WhatsApp dengan nomor dinamis dari CMS.
export function WhatsAppFloat({ previewData }: { previewData?: AppCMSData } = {}) {
  const { data } = useCMS();
  const site = (previewData || data)?.site;

  return (
    <a
      href={waLink(site?.waMessage, site?.whatsapp)}
      target="_blank"
      rel="noreferrer"
      aria-label="Hubungi Admin via WhatsApp"
      className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full bg-primary py-3.5 pl-4 pr-5 text-sm font-bold text-primary-foreground shadow-elegant ring-2 ring-gold/60 transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Hubungi Admin</span>
    </a>
  );
}
