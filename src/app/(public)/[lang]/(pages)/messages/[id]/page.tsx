import { ArrowLeft, BookOpen, Calendar, Download, Headphones, Mic2, Tv } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/reveal";
import { SermonCard } from "@/components/sermon-card";
import { ShareButton } from "@/components/share-button";
import { WhatsAppShare } from "@/components/whatsapp-share";
import { eglise } from "@/config/eglise";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { longDate } from "@/lib/format";
import { fileUrl, getSermon, getSermons } from "@/lib/public-data";

type Params = Promise<{ lang: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!hasLocale(lang)) return {};
  const sermon = await getSermon(Number(id));
  if (!sermon) return {};
  const description = [sermon.speaker, sermon.scripture, sermon.series].filter(Boolean).join(" · ");
  return {
    title: sermon.title,
    description: description || sermon.title,
    alternates: { canonical: `/${lang}/messages/${sermon.id}`, languages: { fr: `/fr/messages/${sermon.id}`, en: `/en/messages/${sermon.id}` } },
    openGraph: {
      title: `${sermon.title} · ${eglise.nom}`,
      description: description || undefined,
      type: "video.other",
      ...(sermon.youtubeId ? { images: [{ url: `https://i.ytimg.com/vi/${sermon.youtubeId}/maxresdefault.jpg`, width: 1280, height: 720 }] } : {}),
    },
  };
}

/** La fiche dépend de l'identifiant : elle est diffusée dans une enveloppe statique (Suspense). */
export default function SermonPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Sermon params={params} />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className="relative isolate overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-24 -z-10 h-[32rem] bg-night lg:top-28" />
      <div className="mx-auto max-w-5xl px-5 pt-32 pb-24 sm:px-8 lg:pt-40">
        <div className="h-3 w-24 rounded bg-white/20" />
        <div className="mt-6 aspect-video animate-pulse rounded-[2rem] bg-night-2" />
        <div className="mt-12 h-10 w-2/3 animate-pulse rounded bg-subtle" />
      </div>
    </div>
  );
}

async function Sermon({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, sermon] = await Promise.all([getDictionary(lang), getSermon(Number(id))]);
  if (!sermon) notFound();
  const all = await getSermons();
  const related = (sermon.series ? all.filter((s) => s.series === sermon.series && s.id !== sermon.id) : all.filter((s) => s.id !== sermon.id)).slice(0, 3);
  const audio = sermon.audioPathname ? fileUrl(sermon.audioPathname) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": sermon.youtubeId ? "VideoObject" : "AudioObject",
    name: sermon.title,
    description: [sermon.scripture, sermon.series].filter(Boolean).join(" · ") || sermon.title,
    uploadDate: sermon.date.toISOString(),
    ...(sermon.youtubeId ? { thumbnailUrl: `https://i.ytimg.com/vi/${sermon.youtubeId}/hqdefault.jpg`, embedUrl: `https://www.youtube.com/embed/${sermon.youtubeId}` } : {}),
    ...(audio ? { contentUrl: `${eglise.siteUrl}${audio}` } : {}),
    publisher: { "@type": "Organization", name: eglise.nom },
    ...(sermon.speaker ? { author: { "@type": "Person", name: sermon.speaker } } : {}),
  };

  return (
    <article className="relative isolate overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Bandeau bleu nuit derrière le lecteur */}
      <div className="absolute inset-x-0 top-24 -z-10 h-[32rem] bg-night lg:top-28" />
      <div className="mx-auto max-w-5xl px-5 pt-32 pb-24 sm:px-8 lg:pt-40">
        <Link href={`/${lang}/messages`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> {t.sermons.eyebrow}
        </Link>
        <Reveal className="mt-6">
          <div className="overflow-hidden rounded-[2rem] bg-night-2 shadow-2xl ring-1 ring-white/10">
            {sermon.youtubeId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${sermon.youtubeId}?rel=0`}
                  title={sermon.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="bg-grain flex aspect-video flex-col items-center justify-center gap-6 p-8 text-center text-white">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-gold text-night"><Headphones className="h-10 w-10" /></span>
                <p className="max-w-md text-white/70">{t.sermons.noVideo}</p>
                {audio && <audio controls preload="none" src={audio} className="w-full max-w-md" />}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal className="mt-12">
          {sermon.series && <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{sermon.series}</p>}
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-balance text-night sm:text-6xl">{sermon.title}</h1>
          <dl className="mt-8 grid gap-5 border-t hairline pt-8 sm:grid-cols-3">
            <Meta icon={Calendar} label={t.sermons.date} value={longDate(sermon.date, lang)} />
            {sermon.speaker && <Meta icon={Mic2} label={t.sermons.speaker} value={sermon.speaker} />}
            {sermon.scripture && <Meta icon={BookOpen} label={t.sermons.scripture} value={sermon.scripture} italic />}
          </dl>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ShareButton title={sermon.title} label={t.common.share} copied={t.common.copied} />
            <WhatsAppShare text={sermon.title} url={`${eglise.siteUrl}/${lang}/messages/${sermon.id}`} label={t.common.whatsapp} />
            {audio && (
              <a href={audio} download className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong">
                <Download className="h-4 w-4" /> {t.common.listen}
              </a>
            )}
            {sermon.youtubeId && (
              <a href={`https://www.youtube.com/watch?v=${sermon.youtubeId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">
                <Tv className="h-4 w-4" /> {t.common.watchYoutube}
              </a>
            )}
          </div>
          {sermon.youtubeId && audio && (
            <div className="mt-8 rounded-3xl border-l-4 border-gold bg-surface p-5 shadow-sm">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t.sermons.audio}</p>
              <audio controls preload="none" src={audio} className="w-full" />
            </div>
          )}
        </Reveal>
      </div>

      {related.length > 0 && (
        <section className="bg-subtle py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{sermon.series ? t.sermons.moreInSeries : t.sermons.more}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-night sm:text-4xl">{sermon.series ?? t.sermons.eyebrow}</h2>
            </Reveal>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s, i) => <SermonCard key={s.id} sermon={s} lang={lang} delay={i * 70} audioLabel={t.sermons.audio} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function Meta({ icon: Icon, label, value, italic = false }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; italic?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night text-gold"><Icon className="h-4 w-4" /></span>
      <span>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
        <dd className={`mt-0.5 ${italic ? "font-display-italic text-xl text-gold" : "font-display text-lg font-semibold"} first-letter:uppercase`}>{value}</dd>
      </span>
    </div>
  );
}
