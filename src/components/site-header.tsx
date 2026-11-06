import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, PhoneCall } from "lucide-react";
import logo from "@/assets/logo.png.asset.json";
import { SITE, waLink } from "@/lib/site";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan & Tarif" },
  { to: "/lacak", label: "Lacak Paket" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src={logo.url}
            alt={SITE.name}
            className="h-10 w-10 shadow-elegant sm:h-12 sm:w-12"
          />
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-foreground sm:text-lg">
              Jastip <span className="text-gradient-gold">Anggun Jaya</span>
            </span>
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors " +
                (isActive(item.to)
                  ? "bg-secondary text-primary-deep"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={waLink()}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary-deep sm:inline-flex"
          >
            <PhoneCall className="size-4" />
            Hubungi Admin
          </a>
          <button
            type="button"
            aria-label="Buka menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 py-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={
                  "rounded-xl px-4 py-3 text-sm font-semibold " +
                  (isActive(item.to)
                    ? "bg-secondary text-primary-deep"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {item.label}
              </Link>
            ))}
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <PhoneCall className="size-4" />
              Hubungi Admin
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
