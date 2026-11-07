import { Link } from "@tanstack/react-router";
import { MapPin, Clock, PhoneCall } from "lucide-react";
import { getSiteLogoUrl, waLink } from "@/lib/site";
import { useCMS } from "@/lib/cms-context";

export function SiteFooter() {
  const { data } = useCMS();
  const site = data?.site;

  return (
    <footer className="bg-gradient-red text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={getSiteLogoUrl(site?.logoUrl)}
              alt={site?.name || "Jastip Anggun Jaya"}
              className="h-12 w-12 rounded-lg bg-white/10 p-1 object-contain"
            />
            <div>
              <p className="text-lg font-extrabold">{site?.name || "Jastip Anggun Jaya"}</p>
              <p className="text-sm text-primary-foreground/80">{site?.tagline}</p>
            </div>
          </div>
          <div className="gold-rule mt-5 w-24" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/85">
            Melayani jasa titip dan pengiriman paket, barang, serta kendaraan dari Jakarta,
            Surabaya, dan Makassar menuju Manokwari, Papua.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gold">Menu</p>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/85">
            <li>
              <Link to="/" className="transition-colors hover:text-gold">
                Beranda
              </Link>
            </li>
            <li>
              <Link to="/layanan" className="transition-colors hover:text-gold">
                Layanan & Tarif
              </Link>
            </li>
            <li>
              <Link to="/lacak" className="transition-colors hover:text-gold">
                Lacak Paket
              </Link>
            </li>
            <li>
              <Link to="/kontak" className="transition-colors hover:text-gold">
                Kontak
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gold">Kontak</p>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/85">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{site?.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{site?.hours}</span>
            </li>
          </ul>
          <a
            href={waLink(site?.waMessage, site?.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2.5 text-sm font-bold text-foreground shadow-gold transition-transform hover:scale-[1.02]"
          >
            <PhoneCall className="size-4" />
            Hubungi Admin
          </a>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Jastip Anggun Jaya. Seluruh hak cipta dilindungi.</p>
          <p>{site?.cities}</p>
        </div>
      </div>
    </footer>
  );
}
