import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import { Reveal } from "./reveal";

/** En-tête éditorial des pages intérieures : surtitre, grand titre, texte. */
export function PageIntro({ lang, eyebrow, title, text, back, children }: { lang: Locale; eyebrow: string; title: string; text?: string; back: string; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-bg">
      <div className="absolute -top-40 right-[10%] h-[30rem] w-[30rem] rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-[24rem] w-[24rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pt-36 pb-14 sm:px-8 lg:pt-40">
        <Reveal>
          <Link href={`/${lang}`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:text-accent">
            <ArrowLeft className="h-3.5 w-3.5" /> {back}
          </Link>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] font-semibold tracking-tight text-balance text-night">{title}</h1>
          {text && <p className="mt-6 max-w-2xl text-lg text-muted text-pretty">{text}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
