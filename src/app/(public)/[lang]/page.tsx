import { ArrowDown, ArrowRight, ArrowUpRight, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eglise } from "@/config/eglise";
import { Countdown } from "@/components/countdown";
import { LiveBadge } from "@/components/live-badge";
import { Marquee } from "@/components/marquee";
import { PostCard } from "@/components/post-card";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale, type Locale } from "@/i18n/locales";
import { dateParts } from "@/lib/format";
import { getHomeContent, getLiveStatus } from "@/lib/public-data";

const PHOTOS = [eglise.photos.louange, eglise.photos.jeunesse, eglise.photos.enfants, eglise.photos.priere, eglise.photos.assemblee];

/** Données structurées (schema.org/Church) pour les moteurs de recherche. */
function churchJsonLd(lang: Locale) {
  const x = eglise.t(lang);
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    name: eglise.nom,
    alternateName: "Philadelphie SDA Church",
    description: x.description,
    url: `${eglise.siteUrl}/${lang}`,
    email: eglise.email,
    ...(eglise.telephone ? { telephone: eglise.telephone } : {}),
    address: { "@type": "PostalAddress", streetAddress: "3642 North Emerson Avenue", addressLocality: "Indianapolis", addressRegion: "IN", postalCode: "46218", addressCountry: "US" },
    hasMap: eglise.carte,
    sameAs: [eglise.youtube, eglise.facebook].filter(Boolean),
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:30", closes: "14:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "19:00", closes: "20:30" },
    ],
    event: eglise.creneaux.map((c) => ({ "@type": "Event", name: x.cultes[c.index].nom, description: x.cultes[c.index].detail, location: { "@type": "Place", name: eglise.nom, address: eglise.adresse }, eventSchedule: { "@type": "Schedule", byDay: `https://schema.org/${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][c.weekday]}`, startTime: `${String(c.hour).padStart(2, "0")}:${String(c.minute).padStart(2, "0")}`, repeatFrequency: "P1W" } })),
  };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, { news, upcoming, vie }, status] = await Promise.all([getDictionary(lang), getHomeContent(), getLiveStatus()]);
  const x = eglise.t(lang);
  const slots = eglise.creneaux.map((c) => ({ ...c, nom: x.cultes[c.index].nom, heure: x.cultes[c.index].heure }));
  const pick = (fr: string, en: string | null) => (lang === "en" && en ? en : fr);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchJsonLd(lang)) }} />
      <SiteHeader lang={lang} nav={t.nav} sousTitre={x.sousTitre} live={status.live} />
      <main className="flex-1">
        {/* ---------- Héros : photo fondue à droite ---------- */}
        <section className="relative isolate overflow-hidden bg-bg">
          <div
            className="bloom absolute inset-y-0 right-0 hidden w-[58%] lg:block"
            style={{
              animationDelay: "150ms",
              // Fondu réel du bord gauche (masque) : pas de couture, couleurs intactes
              maskImage: "linear-gradient(to right, transparent 0%, black 38%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%)",
            }}
          >
            <Image src={eglise.photos.hero} alt={t.hero.photoAlt} fill priority sizes="58vw" className="object-cover object-[75%_center]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
          </div>
          <div className="absolute -top-40 left-[20%] h-[36rem] w-[36rem] rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pt-32 pb-24 sm:px-8 lg:pt-28">
            <p className="rise text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.hero.eyebrow}</p>
            <h1 className="mt-8 font-display text-[clamp(3.4rem,10vw,8.5rem)] leading-[0.9] font-semibold tracking-tight text-night">
              <span className="rise block" style={{ animationDelay: "80ms" }}>{t.hero.l1}</span>
              <span className="rise block" style={{ animationDelay: "180ms" }}>{t.hero.l2}</span>
              <span className="rise block" style={{ animationDelay: "280ms" }}>{t.hero.l3}</span>
              <span className="rise block font-display-italic font-normal text-accent" style={{ animationDelay: "380ms" }}>{t.hero.l4}</span>
            </h1>
            <p className="rise mt-8 max-w-md text-lg text-muted text-pretty" style={{ animationDelay: "520ms" }}>{t.hero.text}</p>
            <div className="rise mt-10 flex flex-wrap items-center gap-6" style={{ animationDelay: "640ms" }}>
              <a href="#venir" className="group inline-flex items-center gap-3 rounded-full bg-accent py-3.5 pr-2 pl-7 text-sm font-semibold text-white shadow-xl shadow-accent/25 transition hover:bg-accent-strong">
                {t.hero.cta}
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-night transition group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
              </a>
              {status.live ? (
                <LiveBadge lang={lang} label={t.hero.liveNow} size="lg" />
              ) : (
                <Link href={`/${lang}/en-direct`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80 hover:text-accent">
                  <PlayCircle className="h-6 w-6 text-accent" /> {t.hero.live}
                </Link>
              )}
            </div>

            {/* Photo + compte à rebours (mobile / tablette) */}
            <div className="bloom relative mt-14 lg:hidden" style={{ animationDelay: "300ms" }}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl">
                <Image src={eglise.photos.hero} alt={t.hero.photoAlt} fill priority sizes="90vw" className="object-cover" />
              </div>
              <div className="relative -mt-10 ml-auto w-[85%] rounded-3xl bg-night p-6 text-white shadow-2xl sm:w-[60%]">
                <Countdown slots={slots} labels={t.countdown} />
              </div>
            </div>

            <a href="#venir" className="rise absolute bottom-8 left-5 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:text-accent sm:left-8 lg:flex" style={{ animationDelay: "900ms" }}>
              <span className="bob grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-accent"><ArrowDown className="h-4 w-4" /></span> {t.hero.discover}
            </a>

            {/* Compte à rebours sur la photo (desktop) */}
            <div className="bloom absolute right-5 bottom-10 hidden w-80 rounded-3xl bg-night/95 p-7 text-white shadow-2xl backdrop-blur lg:block sm:right-8" style={{ animationDelay: "700ms" }}>
              <Countdown slots={slots} labels={t.countdown} />
            </div>
          </div>

          <div className="relative bg-accent py-4 text-white">
            <Marquee items={[...t.marquee]} />
          </div>
        </section>

        {/* ---------- Venir : liste éditoriale numérotée ---------- */}
        <section id="venir" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.venir.eyebrow}</p>
              <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-night sm:text-5xl">{t.venir.title}</h2>
              <p className="mt-5 text-muted text-pretty">{t.venir.text}</p>
              <a href={eglise.carte} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                {eglise.adresse} <ArrowUpRight className="h-4 w-4" />
              </a>
            </Reveal>
            <div>
              {x.cultes.map((c, i) => (
                <Reveal key={c.nom} delay={i * 70}>
                  <div className="group grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-4 border-t hairline py-6 transition hover:bg-subtle sm:grid-cols-[4rem_1fr_auto] sm:px-3">
                    <span className="font-display-italic text-2xl text-gold">0{i + 1}</span>
                    <span>
                      <span className="block font-display text-2xl font-semibold sm:text-3xl">{c.nom}</span>
                      <span className="mt-1 block text-sm text-muted">{c.detail}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-2xl font-semibold tabular-nums sm:text-3xl">{c.heure}</span>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{c.jour}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
              <div className="border-t hairline" />
            </div>
          </div>
        </section>

        {/* ---------- Ministères ---------- */}
        <section id="ministeres" className="bg-subtle py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.ministeres.eyebrow}</p>
                  <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-night sm:text-5xl">{t.ministeres.title}</h2>
                </div>
                <Link href={`/${lang}/contact`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                  {t.ministeres.serve} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            {/* Mobile : grille de deux colonnes (la 5e carte sur toute la largeur) · Desktop : rangée de cinq */}
            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
              {t.ministeres.items.map((m, i) => (
                <Reveal key={m.name} delay={i * 60} className={i === 4 ? "col-span-2 lg:col-span-1" : ""}>
                  <article className={`group relative overflow-hidden rounded-[1.25rem] lg:aspect-[4/5] lg:rounded-[1.5rem] ${i === 4 ? "aspect-[2/1]" : "aspect-square"}`}>
                    <Image src={PHOTOS[i]} alt="" fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white lg:p-5">
                      <p className="font-display-italic text-lg text-gold">0{i + 1}</p>
                      <h3 className="font-display text-xl font-semibold lg:text-2xl">{m.name}</h3>
                      <p className="text-xs text-white/70">{m.sub}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Mot du pasteur ---------- */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal>
            <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] lg:mx-0">
                <Image src={eglise.photos.priere} alt="" fill sizes="24rem" className="object-cover" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                <div className="absolute -right-3 -bottom-3 h-24 w-24 rounded-full bg-gold" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.mot.eyebrow}</p>
                <p className="mt-6 font-display text-2xl leading-snug font-medium text-pretty sm:text-3xl">
                  <span className="font-display-italic text-5xl text-gold">«</span> {x.motDuPasteur.texte}
                </p>
                <p className="mt-6 font-display-italic text-xl text-muted">— {x.motDuPasteur.auteur}</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- Messages / en direct ---------- */}
        <section id="message" className="bg-subtle">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <Link href={`/${lang}/en-direct`} className="group relative block aspect-video overflow-hidden rounded-[2rem] bg-night shadow-2xl">
                <Image src={eglise.photos.louange} alt="" fill sizes="(min-width:1024px) 45vw, 90vw" className="object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-70" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-gold text-night shadow-xl transition group-hover:scale-110"><PlayCircle className="h-10 w-10" /></span>
                </span>
                {status.live ? (
                  <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {t.live.badge}</span>
                ) : (
                  <span className="absolute top-5 left-5 rounded-full bg-night/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">{t.messages.badge}</span>
                )}
              </Link>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.messages.eyebrow}</p>
              <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-night sm:text-5xl">{t.messages.title}</h2>
              <p className="mt-5 text-muted text-pretty">{t.messages.text}</p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                <Link href={`/${lang}/messages`} className="inline-flex items-center gap-2 font-semibold text-accent hover:underline">{t.sermons.eyebrow} <ArrowRight className="h-4 w-4" /></Link>
                <a href={eglise.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-accent hover:underline">{t.messages.cta} <ArrowUpRight className="h-4 w-4" /></a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- Agenda ---------- */}
        <section id="agenda" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.agenda.eyebrow}</p>
              <h2 className="mt-4 font-display text-4xl font-semibold text-night sm:text-5xl">{t.agenda.title}</h2>
              {upcoming.length === 0 ? (
                <p className="mt-8 border-t hairline pt-6 text-muted">{t.agenda.empty}</p>
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
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Reveal>
            <Reveal delay={100}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.agenda.newsEyebrow}</p>
              <h2 className="mt-4 font-display text-4xl font-semibold text-night sm:text-5xl">{t.agenda.newsTitle}</h2>
              {news.length === 0 ? (
                <p className="mt-8 border-t hairline pt-6 text-muted">{t.agenda.newsEmpty}</p>
              ) : (
                <ul className="mt-8 space-y-4">
                  {news.map((a) => (
                    <li key={a.id} className="rounded-3xl border-l-4 border-gold bg-surface p-6 shadow-sm">
                      <p className="font-display text-xl font-semibold text-night">{pick(a.title, a.titleEn)}</p>
                      <p className="mt-2 text-sm whitespace-pre-line text-muted">{pick(a.body, a.bodyEn)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </div>
        </section>

        {/* ---------- Vie de l'église : publications des départements ---------- */}
        <section id="vie" className="bg-subtle py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.vie.eyebrow}</p>
                  <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-night sm:text-5xl">{t.vie.title}</h2>
                  <p className="mt-4 max-w-xl text-muted text-pretty">{t.vie.homeText}</p>
                </div>
                <Link href={`/${lang}/vie`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                  {t.vie.all} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            {vie.length === 0 ? (
              <Reveal><p className="mt-10 rounded-3xl border border-dashed border-line px-6 py-14 text-center text-muted">{t.vie.empty}</p></Reveal>
            ) : (
              <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {vie.map((p, i) => <PostCard key={p.id} post={p} lang={lang} dept={t.departments[p.department as keyof typeof t.departments] ?? p.department} delay={(i % 3) * 70} />)}
              </div>
            )}
          </div>
        </section>

        {/* ---------- Verset ---------- */}
        <section className="relative isolate overflow-hidden bg-night-2 text-white">
          <Image src={eglise.photos.enfants} alt="" fill sizes="100vw" className="object-cover opacity-15" />
          <div className="relative mx-auto max-w-5xl px-5 py-28 text-center sm:px-8">
            <Reveal>
              <span className="font-display-italic text-7xl leading-none text-gold">“</span>
              <p className="mt-2 font-display text-3xl leading-snug font-medium text-balance sm:text-5xl">{x.verset.texte}</p>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{x.verset.reference}</p>
            </Reveal>
          </div>
        </section>

        {/* ---------- Don : section dorée ---------- */}
        <section className="bg-gold text-night">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-20 sm:px-8 md:grid-cols-[1fr_auto]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-night/60">{t.don.eyebrow}</p>
              <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance sm:text-6xl">{t.don.title} <span className="font-display-italic font-normal">{t.don.titleItalic}</span></h2>
              <p className="mt-4 max-w-xl text-night/70">{t.don.text}</p>
            </Reveal>
            <a href={eglise.don} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 rounded-full bg-night py-3 pr-2 pl-7 text-sm font-semibold text-white transition hover:bg-night-2">
              {t.don.cta}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-night transition group-hover:translate-x-0.5"><ArrowUpRight className="h-4 w-4" /></span>
            </a>
          </div>
        </section>

        {/* ---------- Contact ---------- */}
        <section id="contact" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t.contact.eyebrow}</p>
              <h2 className="mt-4 font-display text-4xl font-semibold text-night sm:text-5xl">{t.contact.title}</h2>
              <Link href={`/${lang}/contact`} className="mt-5 inline-flex items-center gap-2 font-semibold text-accent hover:underline">{t.contactPage.title} <ArrowRight className="h-4 w-4" /></Link>
              <dl className="mt-8 divide-y hairline">
                <div className="py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.contact.address}</dt>
                  <dd className="mt-1 font-display text-xl">{eglise.adresse}</dd>
                  <a href={eglise.carte} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent hover:underline">{t.contact.directions} ↗</a>
                </div>
                <div className="py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.contact.email}</dt>
                  <dd className="mt-1 font-display text-xl"><a href={`mailto:${eglise.email}`} className="hover:text-accent">{eglise.email}</a></dd>
                </div>
                {eglise.telephone && (
                  <div className="py-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.contact.phone}</dt>
                    <dd className="mt-1 font-display text-xl">{eglise.telephone}</dd>
                  </div>
                )}
              </dl>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-80 overflow-hidden rounded-[2rem] border hairline shadow-xl lg:h-full lg:min-h-[24rem]">
                <iframe title={t.contact.map} src={eglise.carteEmbed} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} t={{ ...t.footer, espace: t.nav.espace }} nav={t.nav} />
    </>
  );
}
