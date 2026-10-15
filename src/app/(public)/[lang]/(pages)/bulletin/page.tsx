import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Reveal } from "@/components/reveal";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { longDate, shortDate } from "@/lib/format";
import { fileUrl, getBulletins } from "@/lib/public-data";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.bulletin.eyebrow,
    description: t.bulletin.metaDescription,
    alternates: { canonical: `/${lang}/bulletin`, languages: { fr: "/fr/bulletin", en: "/en/bulletin" } },
  };
}

export default async function BulletinPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, list] = await Promise.all([getDictionary(lang), getBulletins()]);
  const [latest, ...archive] = list;
  return (
    <>
      <PageIntro lang={lang} eyebrow={t.bulletin.eyebrow} title={t.bulletin.title} text={t.bulletin.text} back={t.common.home} />
      <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        {!latest ? (
          <p className="rounded-3xl border border-dashed border-line px-6 py-16 text-center text-muted">{t.bulletin.empty}</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.bulletin.latest}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-night first-letter:uppercase sm:text-4xl">{t.bulletin.weekOf} {longDate(latest.weekOf, lang)}</h2>
              {latest.notes && <p className="mt-2 text-muted">{latest.notes}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={fileUrl(latest.pathname)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-accent/25 transition hover:bg-accent-strong">
                  <FileText className="h-4 w-4" /> {t.bulletin.open}
                </a>
                <a href={fileUrl(latest.pathname)} download className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">
                  <Download className="h-4 w-4" /> {t.common.download}
                </a>
              </div>
              <div className="mt-8 hidden overflow-hidden rounded-[2rem] border hairline bg-surface shadow-2xl md:block">
                <iframe title={t.bulletin.preview} src={`${fileUrl(latest.pathname)}#toolbar=0&view=FitH`} className="h-[48rem] w-full" loading="lazy" />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.bulletin.archive}</p>
              {archive.length === 0 ? (
                <p className="mt-4 border-t hairline pt-5 text-sm text-muted">—</p>
              ) : (
                <ul className="mt-4 divide-y hairline border-t hairline">
                  {archive.map((b) => (
                    <li key={b.id}>
                      <a href={fileUrl(b.pathname)} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 py-4 transition hover:text-accent">
                        <span>
                          <span className="block font-display text-xl font-semibold first-letter:uppercase">{shortDate(b.weekOf, lang)}</span>
                          {b.notes && <span className="block text-sm text-muted">{b.notes}</span>}
                        </span>
                        <FileText className="h-5 w-5 shrink-0 text-muted transition group-hover:text-gold" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </div>
        )}
      </section>
    </>
  );
}
