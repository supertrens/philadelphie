import { ArrowLeft, Calendar, Tag } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard, excerpt, postText } from "@/components/post-card";
import { Reveal } from "@/components/reveal";
import { ShareButton } from "@/components/share-button";
import { eglise } from "@/config/eglise";
import { type Dictionary, getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { longDate } from "@/lib/format";
import { fileUrl, getPost, getPosts } from "@/lib/public-data";

type Params = Promise<{ lang: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!hasLocale(lang)) return {};
  const post = await getPost(Number(id));
  if (!post) return {};
  const { title, body } = postText(post, lang);
  return {
    title,
    description: excerpt(body, 160),
    alternates: { canonical: `/${lang}/vie/${post.id}`, languages: { fr: `/fr/vie/${post.id}`, en: `/en/vie/${post.id}` } },
  };
}

/** La fiche dépend de l'identifiant : elle est diffusée dans une enveloppe statique (Suspense). */
export default function PostPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Post params={params} />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-36 pb-24 sm:px-8 lg:pt-40" aria-hidden="true">
      <div className="h-3 w-24 rounded bg-subtle" />
      <div className="mt-8 h-12 w-2/3 animate-pulse rounded bg-subtle" />
      <div className="mt-10 aspect-[16/9] animate-pulse rounded-[2rem] bg-subtle" />
    </div>
  );
}

async function Post({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, post] = await Promise.all([getDictionary(lang), getPost(Number(id))]);
  if (!post) notFound();
  const { title, body, date } = postText(post, lang);
  const label = (slug: string) => t.departments[slug as keyof Dictionary["departments"]] ?? slug;
  const others = (await getPosts()).filter((p) => p.id !== post.id).slice(0, 3);
  const photo = post.photoPathname ? fileUrl(post.photoPathname) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    datePublished: date.toISOString(),
    articleSection: label(post.department),
    ...(photo ? { image: [`${eglise.siteUrl}${photo}`] } : {}),
    publisher: { "@type": "Organization", name: eglise.nom },
  };

  return (
    <article className="relative isolate overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="absolute -top-40 right-[10%] -z-10 h-[30rem] w-[30rem] rounded-full bg-gold/15 blur-3xl" />
      <div className="mx-auto max-w-5xl px-5 pt-36 pb-24 sm:px-8 lg:pt-40">
        <Reveal>
          <Link href={`/${lang}/vie`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:text-accent">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.vie.eyebrow}
          </Link>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{label(post.department)}</p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.98] font-semibold tracking-tight text-balance text-night">{title}</h1>
        </Reveal>

        {photo && (
          <Reveal className="mt-10">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-night shadow-2xl">
              <Image src={photo} alt="" fill priority sizes="(min-width:1280px) 1000px, 95vw" className="object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
            </div>
          </Reveal>
        )}

        <Reveal className="mt-10">
          <dl className="grid gap-5 border-t hairline pt-8 sm:grid-cols-2">
            <Meta icon={Calendar} label={t.vie.publishedOn} value={longDate(date, lang)} />
            <Meta icon={Tag} label={t.vie.department} value={label(post.department)} />
          </dl>
          <div className="mt-10 max-w-3xl font-display text-xl leading-relaxed whitespace-pre-line text-ink sm:text-2xl">{body}</div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ShareButton title={title} label={t.common.share} copied={t.common.copied} />
          </div>
        </Reveal>
      </div>

      {others.length > 0 && (
        <section className="bg-subtle py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.vie.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-night sm:text-4xl">{t.vie.more}</h2>
            </Reveal>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p, i) => <PostCard key={p.id} post={p} lang={lang} dept={label(p.department)} delay={i * 70} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night text-gold"><Icon className="h-4 w-4" /></span>
      <span>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="mt-0.5 font-display text-lg font-semibold first-letter:uppercase">{value}</dd>
      </span>
    </div>
  );
}
