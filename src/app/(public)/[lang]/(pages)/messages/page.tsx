import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { SermonCard } from "@/components/sermon-card";
import { type Dictionary, getDictionary } from "@/i18n/dictionaries";
import { hasLocale, type Locale } from "@/i18n/locales";
import { getSermons } from "@/lib/public-data";

type Params = Promise<{ lang: string }>;
type Search = Promise<{ serie?: string | string[] }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.sermons.eyebrow,
    description: t.sermons.metaDescription,
    alternates: { canonical: `/${lang}/messages`, languages: { fr: "/fr/messages", en: "/en/messages" } },
  };
}

export default async function SermonsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <>
      <PageIntro lang={lang} eyebrow={t.sermons.eyebrow} title={t.sermons.title} text={t.sermons.text} back={t.common.home} />
      <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        <Suspense fallback={<Skeleton />}>
          <List lang={lang} t={t} searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function List({ lang, t, searchParams }: { lang: Locale; t: Dictionary; searchParams: Search }) {
  const raw = (await searchParams).serie;
  const serie = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null;
  const all = await getSermons();
  const series = [...new Set(all.map((s) => s.series).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, lang));
  const list = serie ? all.filter((s) => s.series === serie) : all;
  const chip = (active: boolean) => `rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${active ? "border-night bg-night text-gold" : "border-line bg-surface text-ink hover:border-accent hover:text-accent"}`;
  return (
    <>
      {series.length > 0 && (
        <nav aria-label={t.sermons.filterLabel} className="mb-10 flex flex-wrap items-center gap-2 border-t hairline pt-8">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{t.sermons.series}</span>
          <Link href={`/${lang}/messages`} className={chip(!serie)}>{t.common.all}</Link>
          {series.map((x) => <Link key={x} href={`/${lang}/messages?serie=${encodeURIComponent(x)}`} className={chip(serie === x)}>{x}</Link>)}
        </nav>
      )}
      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-6 py-16 text-center text-muted">{serie ? t.sermons.emptySeries : t.sermons.empty}</p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => <SermonCard key={s.id} sermon={s} lang={lang} delay={(i % 3) * 70} audioLabel={t.sermons.audio} serviceLabel={t.sermons.serviceOf} />)}
        </div>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video rounded-[1.5rem] bg-subtle" />
          <div className="mt-4 h-3 w-1/3 rounded bg-subtle" />
          <div className="mt-3 h-6 w-3/4 rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}
