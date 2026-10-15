import { and, asc, desc, eq, gte } from "drizzle-orm";
import { ArrowDown, ArrowRight, ArrowUpRight, PlayCircle } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import { eglise } from "@/config/eglise";
import { announcements, db, events } from "@/db";
import { Countdown } from "@/components/countdown";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

async function getPublicContent() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  const [news, upcoming] = await Promise.all([
    db.select().from(announcements).where(eq(announcements.published, true)).orderBy(desc(announcements.createdAt)).limit(3),
    db.select().from(events).where(and(eq(events.isPublic, true), gte(events.startsAt, new Date()))).orderBy(asc(events.startsAt)).limit(5),
  ]);
  return { news, upcoming };
}

// Créneaux pour le compte à rebours (0 = dimanche … 6 = samedi)
const SLOTS = [
  { weekday: 6, hour: 9, minute: 30, nom: "École du Sabbat", heure: "9h30" },
  { weekday: 6, hour: 11, minute: 0, nom: "Culte divin", heure: "11h00" },
  { weekday: 6, hour: 16, minute: 0, nom: "Jeunesse Adventiste", heure: "16h00" },
  { weekday: 3, hour: 19, minute: 0, nom: "Réunion de prière", heure: "19h00" },
];

const MINISTERES = [
  { n: "01", name: "Louange", sub: "Chorale & musiciens", photo: eglise.photos.louange },
  { n: "02", name: "Jeunesse", sub: "JA · 13-30 ans", photo: eglise.photos.jeunesse },
  { n: "03", name: "Enfants", sub: "École du Sabbat", photo: eglise.photos.enfants },
  { n: "04", name: "Prière", sub: "Intercession & visites", photo: eglise.photos.priere },
  { n: "05", name: "Communauté", sub: "Accueil & repas", photo: eglise.photos.communaute },
];

const dateParts = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Indiana/Indianapolis", day: "2-digit", month: "short", weekday: "long", hour: "2-digit", minute: "2-digit" });
function parts(d: Date) {
  const p = Object.fromEntries(dateParts.formatToParts(d).map((x) => [x.type, x.value]));
  return { day: p.day, month: p.month.replace(".", ""), weekday: p.weekday, time: `${p.hour}h${p.minute}` };
}

export default async function Home() {
  const { news, upcoming } = await getPublicContent();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ---------- Héros : photo fondue à droite ---------- */}
        <section className="relative isolate overflow-hidden bg-bg">
          {/* Photo (desktop) : bord gauche fondu dans le fond */}
          <div
            className="bloom absolute inset-y-0 right-0 hidden w-[58%] lg:block"
            style={{
              animationDelay: "150ms",
              // Fondu réel du bord gauche (masque) : pas de couture, couleurs intactes
              maskImage: "linear-gradient(to right, transparent 0%, black 38%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%)",
            }}
          >
            <Image src={eglise.photos.hero} alt="Assemblée pendant le culte" fill priority sizes="58vw" className="object-cover object-[75%_center]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
          </div>
          <div className="absolute -top-40 left-[20%] h-[36rem] w-[36rem] rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pt-32 pb-24 sm:px-8 lg:pt-28">
            <p className="rise text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Indianapolis · Francophone · Adventiste</p>
            <h1 className="mt-8 font-display text-[clamp(3.4rem,10vw,8.5rem)] leading-[0.9] font-semibold tracking-tight text-night">
              <span className="rise block" style={{ animationDelay: "80ms" }}>Une famille</span>
              <span className="rise block" style={{ animationDelay: "180ms" }}>pour croire,</span>
              <span className="rise block" style={{ animationDelay: "280ms" }}>grandir et</span>
              <span className="rise block font-display-italic font-normal text-accent" style={{ animationDelay: "380ms" }}>servir ensemble.</span>
            </h1>
            <p className="rise mt-8 max-w-md text-lg text-muted text-pretty" style={{ animationDelay: "520ms" }}>
              Une église où l’on vous appelle par votre prénom. Venez comme vous êtes, ce Sabbat.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-6" style={{ animationDelay: "640ms" }}>
              <a href="#venir" className="group inline-flex items-center gap-3 rounded-full bg-accent py-3.5 pr-2 pl-7 text-sm font-semibold text-white shadow-xl shadow-accent/25 transition hover:bg-accent-strong">
                Venir ce Sabbat
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-night transition group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
              </a>
              <a href={eglise.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80 hover:text-accent">
                <PlayCircle className="h-6 w-6 text-accent" /> Culte en direct
              </a>
            </div>

            {/* Photo + compte à rebours (mobile / tablette) */}
            <div className="bloom relative mt-14 lg:hidden" style={{ animationDelay: "300ms" }}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl">
                <Image src={eglise.photos.hero} alt="Culte à l'église" fill priority sizes="90vw" className="object-cover" />
              </div>
              <div className="relative -mt-10 ml-auto w-[85%] rounded-3xl bg-night p-6 text-white shadow-2xl sm:w-[60%]">
                <Countdown slots={SLOTS} />
              </div>
            </div>

            <a href="#venir" className="rise absolute bottom-8 left-5 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:text-accent sm:left-8 lg:flex" style={{ animationDelay: "900ms" }}>
              <span className="bob grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-accent"><ArrowDown className="h-4 w-4" /></span> Découvrir
            </a>

            {/* Compte à rebours sur la photo (desktop) */}
            <div className="bloom absolute right-5 bottom-10 hidden w-80 rounded-3xl bg-night/95 p-7 text-white shadow-2xl backdrop-blur lg:block sm:right-8" style={{ animationDelay: "700ms" }}>
              <Countdown slots={SLOTS} />
            </div>
          </div>

          <div className="relative bg-accent py-4 text-white">
            <Marquee items={["Bienvenue", "Byenveni", "Welcome", "Bienvenido", "Karibu", "Shalom"]} />
          </div>
        </section>

        {/* ---------- Venir : liste éditoriale numérotée ---------- */}
        <section id="venir" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Venir</p>
              <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-night sm:text-5xl">Votre premier Sabbat, en toute simplicité.</h2>
              <p className="mt-5 text-muted text-pretty">Venez comme vous êtes. Quelqu’un vous accueillera à la porte, vous aidera à trouver une place et répondra à vos questions.</p>
              <a href={eglise.carte} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                {eglise.adresse} <ArrowUpRight className="h-4 w-4" />
              </a>
            </Reveal>
            <div>
              {eglise.cultes.map((c, i) => (
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Ministères</p>
                  <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-night sm:text-5xl">Chacun a sa place.</h2>
                </div>
                <a href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                  Envie de servir ? Parlez-nous <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
            {/* Mobile : bande à faire défiler · Desktop : rangée de cinq */}
            <div className="snap-x-scroll -mx-5 mt-10 flex gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
              {MINISTERES.map((m, i) => (
                <Reveal key={m.n} delay={i * 60} className="w-[16rem] shrink-0 lg:w-auto">
                  <article className="group relative aspect-[3/4] overflow-hidden rounded-[1.5rem] lg:aspect-[4/5]">
                    <Image src={m.photo} alt="" fill sizes="(min-width:1024px) 20vw, 16rem" className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="font-display-italic text-lg text-gold">{m.n}</p>
                      <h3 className="font-display text-2xl font-semibold">{m.name}</h3>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Mot d’accueil</p>
                <p className="mt-6 font-display text-2xl leading-snug font-medium text-pretty sm:text-3xl">
                  <span className="font-display-italic text-5xl text-gold">«</span> {eglise.motDuPasteur.texte}
                </p>
                <p className="mt-6 font-display-italic text-xl text-muted">— {eglise.motDuPasteur.auteur}</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- Messages / en direct ---------- */}
        <section id="message" className="bg-subtle">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <a href={eglise.youtube} target="_blank" rel="noreferrer" className="group relative block aspect-video overflow-hidden rounded-[2rem] bg-night shadow-2xl">
                <Image src={eglise.photos.louange} alt="" fill sizes="(min-width:1024px) 45vw, 90vw" className="object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-70" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-gold text-night shadow-xl transition group-hover:scale-110"><PlayCircle className="h-10 w-10" /></span>
                </span>
                <span className="absolute top-5 left-5 rounded-full bg-night/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">Chaque Sabbat · 11h00</span>
              </a>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Messages</p>
              <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-night sm:text-5xl">Loin d’Indianapolis ? Le culte vient à vous.</h2>
              <p className="mt-5 text-muted text-pretty">Chaque Sabbat, le culte est diffusé en direct sur YouTube. Retrouvez aussi les messages précédents pour les réécouter ou les partager.</p>
              <a href={eglise.youtube} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 font-semibold text-accent hover:underline">Voir la chaîne YouTube <ArrowUpRight className="h-4 w-4" /></a>
            </Reveal>
          </div>
        </section>

        {/* ---------- Agenda ---------- */}
        <section id="agenda" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Agenda</p>
              <h2 className="mt-4 font-display text-4xl font-semibold text-night sm:text-5xl">À venir</h2>
              {upcoming.length === 0 ? (
                <p className="mt-8 border-t hairline pt-6 text-muted">Les prochains événements seront annoncés ici. En attendant, rejoignez-nous ce Sabbat !</p>
              ) : (
                <ul className="mt-8">
                  {upcoming.map((e) => {
                    const d = parts(e.startsAt);
                    return (
                      <li key={e.id} className="grid grid-cols-[4.5rem_1fr] gap-5 border-t hairline py-5">
                        <span className="text-center">
                          <span className="block font-display text-4xl leading-none font-semibold text-accent">{d.day}</span>
                          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{d.month}</span>
                        </span>
                        <span>
                          <span className="block font-display text-xl font-semibold">{e.title}</span>
                          <span className="block text-sm text-muted capitalize">{d.weekday} · {d.time}{e.location ? ` · ${e.location}` : ""}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Reveal>
            <Reveal delay={100}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Annonces</p>
              <h2 className="mt-4 font-display text-4xl font-semibold text-night sm:text-5xl">Vie de l’église</h2>
              {news.length === 0 ? (
                <p className="mt-8 border-t hairline pt-6 text-muted">Aucune annonce pour le moment.</p>
              ) : (
                <ul className="mt-8 space-y-4">
                  {news.map((a) => (
                    <li key={a.id} className="rounded-3xl border-l-4 border-gold bg-surface p-6 shadow-sm">
                      <p className="font-display text-xl font-semibold text-night">{a.title}</p>
                      <p className="mt-2 text-sm whitespace-pre-line text-muted">{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </div>
        </section>

        {/* ---------- Verset ---------- */}
        <section className="relative isolate overflow-hidden bg-night-2 text-white">
          <Image src={eglise.photos.enfants} alt="" fill sizes="100vw" className="object-cover opacity-15" />
          <div className="relative mx-auto max-w-5xl px-5 py-28 text-center sm:px-8">
            <Reveal>
              <span className="font-display-italic text-7xl leading-none text-gold">“</span>
              <p className="mt-2 font-display text-3xl leading-snug font-medium text-balance sm:text-5xl">{eglise.verset.texte}</p>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{eglise.verset.reference}</p>
            </Reveal>
          </div>
        </section>

        {/* ---------- Don : section dorée ---------- */}
        <section className="bg-gold text-night">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-20 sm:px-8 md:grid-cols-[1fr_auto]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-night/60">Dîmes & offrandes</p>
              <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance sm:text-6xl">Soutenir la mission, <span className="font-display-italic font-normal">en un clic.</span></h2>
              <p className="mt-4 max-w-xl text-night/70">Vos dons passent par AdventistGiving, la plateforme sécurisée de l’Église adventiste. Reçu fiscal automatique.</p>
            </Reveal>
            <a href={eglise.don} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 rounded-full bg-night py-3 pr-2 pl-7 text-sm font-semibold text-white transition hover:bg-night-2">
              Donner en ligne
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-night transition group-hover:translate-x-0.5"><ArrowUpRight className="h-4 w-4" /></span>
            </a>
          </div>
        </section>

        {/* ---------- Contact ---------- */}
        <section id="contact" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Contact</p>
              <h2 className="mt-4 font-display text-4xl font-semibold text-night sm:text-5xl">Venez nous voir.</h2>
              <dl className="mt-8 divide-y hairline">
                <div className="py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Adresse</dt>
                  <dd className="mt-1 font-display text-xl">{eglise.adresse}</dd>
                  <a href={eglise.carte} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent hover:underline">Itinéraire ↗</a>
                </div>
                <div className="py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">E-mail</dt>
                  <dd className="mt-1 font-display text-xl"><a href={`mailto:${eglise.email}`} className="hover:text-accent">{eglise.email}</a></dd>
                </div>
                {eglise.telephone && (
                  <div className="py-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Téléphone</dt>
                    <dd className="mt-1 font-display text-xl">{eglise.telephone}</dd>
                  </div>
                )}
              </dl>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-80 overflow-hidden rounded-[2rem] border hairline shadow-xl lg:h-full lg:min-h-[24rem]">
                <iframe title="Plan d'accès" src={eglise.carteEmbed} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
