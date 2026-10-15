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
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-3 font-display text-xl hover:bg-subtle ${isActive(l.href) ? "text-accent" : ""}`}>
            {l.label}
            {l.live && <span className="rounded-full bg-red-600 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">{nav.liveNow}</span>}
          </Link>
        ))}
        <a href={otherHref} className="mt-1 block rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wider text-muted hover:bg-subtle">{nav.switch}</a>
      </>
    );
  }
  return (
    <>
      {links.map((l) =>
        l.live ? (
          <LiveBadge key={l.href} lang={lang} label={nav.liveNow} />
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

export function SiteHeader({ lang, nav, sousTitre, live = false }: { lang: Locale; nav: Nav; sousTitre: string; live?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const other: Locale = lang === "fr" ? "en" : "fr";
  // Transparente sur le héros, puis blanche et ombrée dès qu'on fait défiler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const close = () => setOpen(false);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 text-night transition-[background-color,box-shadow] duration-300 ${scrolled || open ? "nav-solid" : ""}`}>
      <div className="h-1 bg-gradient-to-r from-gold via-gold-strong to-gold" />
      <nav className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 transition-[padding] duration-300 sm:px-8 ${scrolled ? "py-3" : "py-5"}`}>
        <Link href={`/${lang}`} className="flex items-center gap-3" onClick={close}>
          <Logo size={34} />
          <span className="leading-none">
            <span className="block font-display-italic text-2xl">Philadelphie</span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:block">{sousTitre}</span>
          </span>
        </Link>
        <div className="hidden items-center gap-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/70 lg:flex xl:gap-7 xl:text-[13px]">
          <Suspense fallback={<NavLinks lang={lang} nav={nav} live={live} pathname={null} />}>
            <NavLinksLive lang={lang} nav={nav} live={live} />
          </Suspense>
          <a href={eglise.don} target="_blank" rel="noreferrer" className="rounded-full bg-gold px-5 py-2 text-night transition hover:bg-gold-strong">{nav.donner}</a>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          {/* En direct : la pastille remplace le sélecteur de langue (présent dans le menu) */}
          {live ? <LiveBadge lang={lang} label={nav.direct} /> : <a href={`/${other}`} aria-label={nav.switchAria} className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider">{nav.switch}</a>}
          <button className="rounded-lg p-2" aria-label={open ? nav.menuClose : nav.menuOpen} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="mx-5 mb-4 rounded-2xl border border-line bg-surface p-4 shadow-2xl lg:hidden">
          <Suspense fallback={<NavLinks lang={lang} nav={nav} live={live} mobile onNavigate={close} pathname={null} />}>
            <NavLinksLive lang={lang} nav={nav} live={live} mobile onNavigate={close} />
          </Suspense>
          <a href={eglise.don} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl bg-gold px-3 py-3 text-center font-semibold text-night">{nav.donnerLong}</a>
        </div>
      )}
    </header>
  );
}
