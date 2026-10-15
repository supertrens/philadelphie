import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Reveal } from "@/components/reveal";
import { eglise } from "@/config/eglise";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { PrayerForm } from "./prayer-form";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.prayer.eyebrow,
    description: t.prayer.metaDescription,
    alternates: { canonical: `/${lang}/priere`, languages: { fr: "/fr/priere", en: "/en/priere" } },
  };
}

export default async function PrayerPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <>
      <PageIntro lang={lang} eyebrow={t.prayer.eyebrow} title={t.prayer.title} text={t.prayer.text} back={t.common.home} />
      <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image src={eglise.photos.priere} alt="" fill sizes="(min-width:1024px) 35vw, 90vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <span className="font-display-italic text-5xl leading-none text-gold">“</span>
                <p className="mt-1 font-display text-2xl leading-snug font-medium text-balance">{t.prayer.verse}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{t.prayer.verseRef}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <PrayerForm t={{ ...t.prayer, sending: t.common.sending, errorGeneric: t.common.errorGeneric, required: t.common.required }} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
