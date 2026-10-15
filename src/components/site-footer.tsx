import Link from "next/link";
import { eglise } from "@/config/eglise";
import type { Locale } from "@/i18n/locales";
import { Logo } from "./logo";

type Nav = (typeof import("@/i18n/fr.json"))["nav"];

export function SiteFooter({ lang, t, nav }: { lang: Locale; t: { rdv: string; find: string; directions: string; espace: string }; nav: Nav }) {
  const pages = [
    { href: `/${lang}/messages`, label: nav.messages },
    { href: `/${lang}/vie`, label: nav.vie },
    { href: `/${lang}/en-direct`, label: nav.direct },
    { href: `/${lang}/bulletin`, label: nav.bulletin },
    { href: `/${lang}/priere`, label: nav.priere },
    { href: `/${lang}/contact`, label: nav.contact },
  ];
  const x = eglise.t(lang);
  return (
    <footer className="relative overflow-hidden bg-night text-white/70">
      <p aria-hidden="true" className="text-outline pointer-events-none absolute -bottom-6 left-0 w-full select-none whitespace-nowrap font-display text-[22vw] leading-none font-semibold">
        Philadelphie
      </p>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-16 pb-40 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 text-white">
            <Logo />
            <span>
              <span className="block font-display-italic text-2xl">Philadelphie</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">{x.sousTitre}</span>
            </span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-pretty">{x.description}</p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {pages.map((p) => <li key={p.href}><Link href={p.href} className="hover:text-white">{p.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{t.rdv}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {x.cultes.map((c) => (
              <li key={c.nom} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <span>{c.nom}</span><span className="text-white/50">{c.jour.split(" ")[0]} {c.heure}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{t.find}</h3>
          <p className="mt-4 text-sm">{eglise.adresse}</p>
          <a href={eglise.carte} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-white underline underline-offset-4 decoration-gold/60 hover:decoration-gold">{t.directions}</a>
          <p className="mt-4 text-sm"><a href={`mailto:${eglise.email}`} className="hover:text-white">{eglise.email}</a></p>
          {eglise.telephone && <p className="text-sm">{eglise.telephone}</p>}
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <a href={eglise.youtube} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-1.5 hover:border-gold hover:text-white">YouTube</a>
            {eglise.facebook && <a href={eglise.facebook} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-1.5 hover:border-gold hover:text-white">Facebook</a>}
            <Link href="/espace" className="rounded-full border border-white/20 px-3 py-1.5 hover:border-gold hover:text-white">{t.espace}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
