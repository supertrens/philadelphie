import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { PostCard } from "@/components/post-card";
import { type Dictionary, getDictionary } from "@/i18n/dictionaries";
import { hasLocale, type Locale } from "@/i18n/locales";
import { DEPARTMENTS } from "@/lib/departments";
import { getPosts } from "@/lib/public-data";

type Params = Promise<{ lang: string }>;
type Search = Promise<{ dept?: string | string[] }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.vie.eyebrow,
    description: t.vie.metaDescription,
    alternates: { canonical: `/${lang}/vie`, languages: { fr: "/fr/vie", en: "/en/vie" } },
  };
}

export default async function ViePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <>
      <PageIntro lang={lang} eyebrow={t.vie.eyebrow} title={t.vie.title} text={t.vie.text} back={t.common.home} />
      <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        <Suspense fallback={<Skeleton />}>
          <Feed lang={lang} t={t} searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

/** Le fil dépend du filtre (?dept=) : il est diffusé dans une enveloppe statique (Suspense). */
async function Feed({ lang, t, searchParams }: { lang: Locale; t: Dictionary; searchParams: Search }) {
  const raw = (await searchParams).dept;
  const wanted = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null;
  const all = await getPosts();
  const present = DEPARTMENTS.filter((d) => all.some((p) => p.department === d.slug));
  const dept = wanted && present.some((d) => d.slug === wanted) ? wanted : null;
  const list = dept ? all.filter((p) => p.department === dept) : all;
  const label = (slug: string) => t.departments[slug as keyof typeof t.departments] ?? slug;
  const chip = (active: boolean) => `rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${active ? "border-night bg-night text-gold" : "border-line bg-surface text-ink hover:border-accent hover:text-accent"}`;
  return (
    <>
      {present.length > 1 && (
        <nav aria-label={t.vie.filterLabel} className="mb-10 flex flex-wrap items-center gap-2 border-t hairline pt-8">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{t.vie.department}</span>
          <Link href={`/${lang}/vie`} className={chip(!dept)}>{t.common.all}</Link>
          {present.map((d) => <Link key={d.slug} href={`/${lang}/vie?dept=${d.slug}`} className={chip(dept === d.slug)}>{label(d.slug)}</Link>)}
        </nav>
      )}
      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-6 py-16 text-center text-muted">{dept ? t.vie.emptyDept : t.vie.empty}</p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => <PostCard key={p.id} post={p} lang={lang} dept={label(p.department)} delay={(i % 3) * 70} />)}
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
          <div className="aspect-[4/3] rounded-[1.5rem] bg-subtle" />
          <div className="mt-4 h-3 w-1/3 rounded bg-subtle" />
          <div className="mt-3 h-6 w-3/4 rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}
