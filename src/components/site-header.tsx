"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { eglise } from "@/config/eglise";
import type { Locale } from "@/i18n/locales";
import { Logo } from "./logo";

type Nav = { venir: string; ministeres: string; messages: string; agenda: string; contact: string; donner: string; donnerLong: string; switch: string; switchAria: string; menuOpen: string; menuClose: string };

export function SiteHeader({ lang, nav, sousTitre }: { lang: Locale; nav: Nav; sousTitre: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const other: Locale = lang === "fr" ? "en" : "fr";
  const links = [
    { href: `/${lang}#venir`, label: nav.venir },
    { href: `/${lang}#ministeres`, label: nav.ministeres },
    { href: `/${lang}#message`, label: nav.messages },
    { href: `/${lang}#agenda`, label: nav.agenda },
    { href: `/${lang}#contact`, label: nav.contact },
  ];
  // Transparente sur le héros, puis blanche et ombrée dès qu'on fait défiler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 text-night transition-[background-color,box-shadow] duration-300 ${scrolled || open ? "nav-solid" : ""}`}>
      <div className="h-1 bg-gradient-to-r from-gold via-gold-strong to-gold" />
      <nav className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-[padding] duration-300 sm:px-8 ${scrolled ? "py-3" : "py-5"}`}>
        <Link href={`/${lang}`} className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Logo size={34} />
          <span className="leading-none">
            <span className="block font-display-italic text-2xl">Philadelphie</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{sousTitre}</span>
          </span>
        </Link>
        <div className="hidden items-center gap-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/70 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="relative transition-colors hover:text-accent after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full">{l.label}</Link>
          ))}
          <a href={`/${other}`} aria-label={nav.switchAria} className="rounded-full border border-line px-3 py-1.5 text-[11px] hover:border-accent hover:text-accent">{nav.switch}</a>
          <a href={eglise.don} target="_blank" rel="noreferrer" className="rounded-full bg-gold px-5 py-2 text-night transition hover:bg-gold-strong">{nav.donner}</a>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <a href={`/${other}`} aria-label={nav.switchAria} className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider">{nav.switch}</a>
          <button className="rounded-lg p-2" aria-label={open ? nav.menuClose : nav.menuOpen} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="mx-5 mb-4 rounded-2xl border border-line bg-surface p-4 shadow-2xl md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-display text-xl hover:bg-subtle">{l.label}</Link>
          ))}
          <a href={eglise.don} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl bg-gold px-3 py-3 text-center font-semibold text-night">{nav.donnerLong}</a>
        </div>
      )}
    </header>
  );
}
