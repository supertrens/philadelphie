"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { eglise } from "@/config/eglise";
import type { Locale } from "@/i18n/locales";
import { LiveBadge } from "./live-badge";
import { Logo } from "./logo";

type Nav = (typeof import("@/i18n/fr.json"))["nav"];
type Props = { lang: Locale; nav: Nav; live: boolean; mobile?: boolean; onNavigate?: () => void };

function navLinks(lang: Locale, nav: Nav, live: boolean) {
  return [
    { href: `/${lang}#venir`, label: nav.venir },
    { href: `/${lang}/messages`, label: nav.messages },
    { href: `/${lang}/vie`, label: nav.vie },
    { href: `/${lang}/en-direct`, label: nav.direct, live },
    { href: `/${lang}/bulletin`, label: nav.bulletin },
    { href: `/${lang}/priere`, label: nav.priere },
    { href: `/${lang}#agenda`, label: nav.agenda },
    { href: `/${lang}/contact`, label: nav.contact },
  ];
}

/** Liens de navigation ; `pathname` sert à marquer la page courante et à changer de langue sur la même page. */
function NavLinks({ lang, nav, live, mobile = false, onNavigate, pathname }: Props & { pathname: string | null }) {
  const other: Locale = lang === "fr" ? "en" : "fr";
  const otherHref = pathname ? pathname.replace(new RegExp(`^/${lang}(?=/|$)`), `/${other}`) : `/${other}`;
  const isActive = (href: string) => !!pathname && !href.includes("#") && pathname.startsWith(href);
  const links = navLinks(lang, nav, live);
  if (mobile) {
    return (
      <>
        <nav className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={onNavigate} aria-current={isActive(l.href) ? "page" : undefined} className={`flex items-center gap-3 font-display text-3xl font-semibold ${isActive(l.href) ? "text-accent" : "text-night"}`}>
              {l.label}
              {l.live && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />{nav.liveNow}</span>}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-4 px-6 pb-10">
          <a href={otherHref} aria-label={nav.switchAria} className="rounded-full border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink">{nav.switch}</a>
          <a href={eglise.don} target="_blank" rel="noreferrer" className="block w-full rounded-full bg-gold px-5 py-3.5 text-center text-sm font-semibold text-night">{nav.donnerLong}</a>
        </div>
      </>
    );
  }
  return (
    <>
      {links.map((l) =>
        l.live ? (
          // Libellé court sur le bureau : la pastille qui pulse dit déjà « maintenant »
          <LiveBadge key={l.href} lang={lang} label={nav.direct} />
        ) : (
          <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={`relative whitespace-nowrap transition-colors hover:text-accent after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-gold after:transition-all hover:after:w-full ${isActive(l.href) ? "text-accent after:w-full" : "after:w-0"}`}>{l.label}</Link>
        ),
      )}
      <a href={otherHref} aria-label={nav.switchAria} className="rounded-full border border-line px-3 py-1.5 text-[11px] hover:border-accent hover:text-accent">{nav.switch}</a>
    </>
  );
}

function NavLinksLive(props: Props) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

function Brand({ lang, sousTitre, onClick }: { lang: Locale; sousTitre: string; onClick?: () => void }) {
  return (
    <Link href={`/${lang}`} className="flex items-center gap-3" onClick={onClick}>
      <Logo size={34} />
      <span className="leading-none">
        <span className="block font-display-italic text-2xl">Philadelphie</span>
        <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:block">{sousTitre}</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ lang, nav, sousTitre, live = false }: { lang: Locale; nav: Nav; sousTitre: string; live?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const other: Locale = lang === "fr" ? "en" : "fr";
  // Transparente (fondu crème) sur le héros, puis blanche et ombrée dès qu'on fait défiler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Menu plein écran : bloque le défilement de la page et se ferme avec Échap
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 text-night transition-[background-color,box-shadow] duration-300 ${scrolled ? "nav-solid" : "nav-fade pb-6"}`}>
      <div className="h-1 bg-gradient-to-r from-gold via-gold-strong to-gold" />
      <nav className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 transition-[padding] duration-300 sm:px-8 ${scrolled ? "py-3" : "py-5"}`}>
        <Brand lang={lang} sousTitre={sousTitre} onClick={close} />
        {/* Neuf liens : la barre complète n'apparaît qu'à partir de 1280 px, le menu plein écran sert en dessous */}
        <div className="hidden items-center gap-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-night xl:flex 2xl:gap-7 2xl:text-[13px]">
          <Suspense fallback={<NavLinks lang={lang} nav={nav} live={live} pathname={null} />}>
            <NavLinksLive lang={lang} nav={nav} live={live} />
          </Suspense>
          <a href={eglise.don} target="_blank" rel="noreferrer" className="rounded-full bg-gold px-5 py-2 text-night transition hover:bg-gold-strong">{nav.donner}</a>
        </div>
        <div className="flex items-center gap-2 xl:hidden">
          {/* En direct : la pastille remplace le sélecteur de langue (présent dans le menu) */}
          {live ? <LiveBadge lang={lang} label={nav.direct} /> : <a href={`/${other}`} aria-label={nav.switchAria} className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider">{nav.switch}</a>}
          <button className="rounded-lg p-2" aria-label={nav.menuOpen} aria-expanded={open} aria-controls="menu-mobile" onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </div>
      </nav>
      {open && (
        <div id="menu-mobile" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-bg text-night xl:hidden">
          <div className="h-1 bg-gradient-to-r from-gold via-gold-strong to-gold" />
          <div className="flex items-center justify-between px-5 py-5 sm:px-8">
            <Brand lang={lang} sousTitre={sousTitre} onClick={close} />
            <button className="rounded-lg p-2" aria-label={nav.menuClose} onClick={close} autoFocus>
              <X />
            </button>
          </div>
          <Suspense fallback={<NavLinks lang={lang} nav={nav} live={live} mobile onNavigate={close} pathname={null} />}>
            <NavLinksLive lang={lang} nav={nav} live={live} mobile onNavigate={close} />
          </Suspense>
        </div>
      )}
    </header>
  );
}
