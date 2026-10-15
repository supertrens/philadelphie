import { ArrowUpRight, PlayCircle, Tv } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { LiveCount } from "@/components/live-count";
import { PageIntro } from "@/components/page-intro";
import { Reveal } from "@/components/reveal";
import { SermonCard } from "@/components/sermon-card";
import { eglise } from "@/config/eglise";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { longDate } from "@/lib/format";
import { getLiveStatus, getSermons } from "@/lib/public-data";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.live.eyebrow,
    description: t.live.metaDescription,
    alternates: { canonical: `/${lang}/en-direct`, languages: { fr: "/fr/en-direct", en: "/en/en-direct" } },
  };
}

export default async function LivePage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, status, sermons] = await Promise.all([getDictionary(lang), getLiveStatus(), getSermons()]);
  const x = eglise.t(lang);
  const slots = eglise.creneaux.map((c) => ({ ...c, nom: x.cultes[c.index].nom, heure: x.cultes[c.index].heure }));
  const liveUrl = status.url ?? eglise.youtube;
  const embed = status.live && status.youtubeId ? `https://www.youtube-nocookie.com/embed/${status.youtubeId}?autoplay=1&rel=0` : null;
  // Hors direct : le dernier culte de la chaîne, lisible sur place
  const latest = status.live ? null : sermons.find((s) => s.youtubeId);

  return (
    <>
      <PageIntro lang={lang} eyebrow={t.live.eyebrow} title={status.live ? t.live.onTitle : t.live.title} text={status.live ? t.live.text : t.live.offText} back={t.common.home}>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${status.live ? "bg-red-600 text-white" : "border border-line bg-surface text-muted"}`}>
            <span className={`h-2 w-2 rounded-full ${status.live ? "animate-pulse bg-white" : "bg-muted"}`} /> {status.live ? t.live.badge : t.live.offline}
          </span>
          {status.live && <LiveCount one={t.live.withUsOne} many={t.live.withUs} />}
        </div>
      </PageIntro>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] bg-night shadow-2xl">
            {embed ? (
              <div className="aspect-video">
                <iframe src={embed} title={t.live.eyebrow} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" />
              </div>
            ) : latest ? (
              <div>
                <div className="aspect-video">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${latest.youtubeId}?rel=0`} title={latest.title || `${t.sermons.serviceOf} ${longDate(latest.date, lang)}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-white sm:px-8">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{t.live.lastService} · <span className="text-white/80 capitalize">{longDate(latest.date, lang)}</span></span>
                  <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-gold">{t.live.openYoutube} <ArrowUpRight className="h-4 w-4" /></a>
                </div>
              </div>
            ) : (
              <a href={liveUrl} target="_blank" rel="noreferrer" className="group relative block aspect-video">
                <Image src={eglise.photos.louange} alt="" fill sizes="(min-width:1280px) 1200px, 95vw" className="object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-60" priority />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-24 w-24 place-items-center rounded-full bg-gold text-night shadow-xl transition group-hover:scale-110"><PlayCircle className="h-12 w-12" /></span>
                </span>
                {status.live ? (
                  <span className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {t.live.badge}</span>
                ) : (
                  <span className="absolute top-6 left-6 rounded-full bg-night/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">{t.messages.badge}</span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-night to-transparent p-6 text-white sm:p-8">
                  <span className="font-display text-2xl font-semibold sm:text-3xl">{t.live.openYoutube}</span>
                  <ArrowUpRight className="h-6 w-6 text-gold" />
                </span>
              </a>
            )}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <div className="rounded-3xl bg-night p-7 text-white shadow-2xl">
              <Countdown slots={slots} labels={t.countdown} />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.live.schedule}</p>
            <ul className="mt-4 divide-y hairline">
              {x.cultes.map((c) => (
                <li key={c.nom} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="font-display text-xl font-semibold">{c.nom}</span>
                  <span className="text-right text-sm text-muted">{c.jour} · <span className="font-semibold text-ink tabular-nums">{c.heure}</span></span>
                </li>
              ))}
            </ul>
            <a href={eglise.youtube} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">
              <Tv className="h-4 w-4" /> {t.live.channel}
            </a>
          </Reveal>
        </div>
      </section>

      {sermons.length > 0 && (
        <section className="bg-subtle py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.sermons.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-night sm:text-4xl">{t.live.lastMessages}</h2>
            </Reveal>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.slice(0, 3).map((s, i) => <SermonCard key={s.id} sermon={s} lang={lang} delay={i * 70} audioLabel={t.sermons.audio} serviceLabel={t.sermons.serviceOf} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
