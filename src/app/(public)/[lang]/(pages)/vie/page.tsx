import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { PostCard } from "@/components/post-card";
import { Reveal } from "@/components/reveal";
import { type Dictionary, getDictionary } from "@/i18n/dictionaries";
import { hasLocale, type Locale } from "@/i18n/locales";
import { DEPARTMENTS } from "@/lib/departments";
import { dateParts, longDate, shortDate } from "@/lib/format";
import { fileUrl, getAgenda, getPosts } from "@/lib/public-data";

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

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.28em] text-accent";

/** Tout ce qui fait la vie de l'église : annonces, rendez-vous, bulletin de la semaine et nouvelles des départements. */
export default async function ViePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, { news, upcoming, bulletins }] = await Promise.all([getDictionary(lang), getAgenda()]);
  const pick = (fr: string, en: string | null) => (lang === "en" && en ? en : fr);
  const [latest, ...previous] = bulletins;
  return (
    <>
      <PageIntro lang={lang} eyebrow={t.vie.eyebrow} title={t.vie.title} text={t.vie.text} back={t.common.home} />

      {/* ---------- À noter : annonces ---------- */}
      {news.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <Reveal>
            <p className={eyebrow}>{t.vie.notes}</p>
            <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {news.map((a) => (
                <li key={a.id} className="rounded-3xl border-l-4 border-gold bg-surface p-6 shadow-sm">
                  <p className="font-display text-xl font-semibold text-night">{pick(a.title, a.titleEn)}</p>
                  <p className="mt-2 text-sm whitespace-pre-line text-muted">{pick(a.body, a.bodyEn)}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* ---------- Rendez-vous + bulletin ---------- */}
      <section className="bg-subtle py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p className={eyebrow}>{t.vie.events}</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-night sm:text-4xl">{t.agenda.title}</h2>
            {upcoming.length === 0 ? (
              <p className="mt-8 border-t hairline pt-6 text-muted">{t.vie.noEvents}</p>
            ) : (
              <ul className="mt-8">
                {upcoming.map((e) => {
                  const d = dateParts(e.startsAt, lang);
                  return (
                    <li key={e.id} className="grid grid-cols-[4.5rem_1fr] gap-5 border-t hairline py-5">
                      <span className="text-center">
                        <span className="block font-display text-4xl leading-none font-semibold text-accent">{d.day}</span>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{d.month}</span>
                      </span>
                      <span>
                        <span className="block font-display text-xl font-semibold">{pick(e.title, e.titleEn)}</span>
                        <span className="block text-sm text-muted capitalize">{d.weekday} · {d.time}{e.location ? ` · ${e.location}` : ""}</span>
                        {e.description && <span className="mt-1 block text-sm text-muted">{e.description}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>
          <Reveal delay={100}>
            <p className={eyebrow}>{t.bulletin.eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-night sm:text-4xl">{t.vie.bulletinTitle}</h2>
            {!latest ? (
              <p className="mt-8 border-t hairline pt-6 text-muted">{t.vie.bulletinEmpty}</p>
            ) : (
              <div className="mt-8 rounded-[2rem] border hairline bg-surface p-7 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.bulletin.latest}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-night first-letter:uppercase">{t.bulletin.weekOf} {longDate(latest.weekOf, lang)}</p>
                {latest.notes && <p className="mt-2 text-sm text-muted">{latest.notes}</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={fileUrl(latest.pathname)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-strong">
                    <FileText className="h-4 w-4" /> {t.bulletin.open}
                  </a>
                  <a href={fileUrl(latest.pathname)} download className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">
                    <Download className="h-4 w-4" /> {t.common.download}
                  </a>
                </div>
                {previous.length > 0 && (
                  <details className="mt-6 border-t hairline pt-4">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted hover:text-accent">{t.vie.previous}</summary>
                    <ul className="mt-3 divide-y hairline text-sm">
                      {previous.map((b) => (
                        <li key={b.id}>
                          <a href={fileUrl(b.pathname)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 py-2 transition hover:text-accent">
                            <span className="first-letter:uppercase">{shortDate(b.weekOf, lang)}{b.notes ? ` · ${b.notes}` : ""}</span>
                            <FileText className="h-4 w-4 shrink-0 text-muted" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------- Nouvelles des départements ---------- */}
      <section id="nouvelles" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <Reveal>
          <p className={eyebrow}>{t.vie.eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-night sm:text-4xl">{t.vie.news}</h2>
        </Reveal>
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
        <nav aria-label={t.vie.filterLabel} className="mt-8 mb-10 flex flex-wrap items-center gap-2 border-t hairline pt-8">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{t.vie.department}</span>
          <Link href={`/${lang}/vie#nouvelles`} className={chip(!dept)}>{t.common.all}</Link>
          {present.map((d) => <Link key={d.slug} href={`/${lang}/vie?dept=${d.slug}#nouvelles`} className={chip(dept === d.slug)}>{label(d.slug)}</Link>)}
        </nav>
      )}
      {list.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-line px-6 py-16 text-center text-muted">{dept ? t.vie.emptyDept : t.vie.empty}</p>
      ) : (
        <div className={`grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 ${present.length > 1 ? "" : "mt-10"}`}>
          {list.map((p, i) => <PostCard key={p.id} post={p} lang={lang} dept={label(p.department)} delay={(i % 3) * 70} />)}
        </div>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-[1.5rem] bg-subtle" />
          <div className="mt-4 h-3 w-1/3 rounded bg-subtle" />
          <div className="mt-3 h-6 w-3/4 rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}
