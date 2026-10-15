"use client";

import { Cake } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { CATEGORIES, CATEGORY_LABELS, type LiveScreenData } from "@/lib/sabbath";

const REFRESH_MS = 5000;
/** Durée de l'écran des compteurs, puis de chaque nom (visiteur ou anniversaire) : lent, pour ne pas distraire. */
const COUNTS_MS = 30000;
const NAME_MS = 15000;

type Step = { kind: "counts" } | { kind: "visitor"; id: number } | { kind: "birthday"; key: string };

/** Séquence d'affichage : compteurs, puis chaque visiteur, puis chaque anniversaire de la semaine. */
function sequence(d: LiveScreenData): Step[] {
  return [
    { kind: "counts" },
    ...d.visitors.map((v): Step => ({ kind: "visitor", id: v.id })),
    ...d.birthdays.map((b): Step => ({ kind: "birthday", key: `${b.name}|${b.monthDay}` })),
  ];
}

/**
 * Écran plein format pour une télévision : chiffres en direct, puis un écran
 * de bienvenue par visiteur (fond or, confettis), puis un écran par anniversaire.
 */
export function Screen({ initial, title, dateLabel }: { initial: LiveScreenData; title: string; dateLabel: string }) {
  const [data, setData] = useState(initial);
  const [online, setOnline] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [clock, setClock] = useState("");
  const dataRef = useRef(initial);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Rafraîchissement des données toutes les 5 s
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/comptage", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const fresh = (await res.json()) as LiveScreenData;
        if (active) {
          setData(fresh);
          setOnline(true);
        }
      } catch {
        if (active) setOnline(false);
      }
    };
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Passage à l'écran suivant (la durée dépend de l'écran en cours)
  useEffect(() => {
    const seq = sequence(dataRef.current);
    const current = seq[stepIndex % seq.length];
    const t = setTimeout(() => setStepIndex((i) => i + 1), current.kind === "counts" ? COUNTS_MS : NAME_MS);
    return () => clearTimeout(t);
  }, [stepIndex]);

  // Horloge (heure d'Indianapolis)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Indiana/Indianapolis", hour: "2-digit", minute: "2-digit" });
    const tick = () => setClock(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const seq = sequence(data);
  const step = seq[stepIndex % seq.length];
  const visitor = step.kind === "visitor" ? data.visitors.find((v) => v.id === step.id) : undefined;
  const birthday = step.kind === "birthday" ? data.birthdays.find((b) => `${b.name}|${b.monthDay}` === step.key) : undefined;
  const golden = !!visitor;
  const festive = !!visitor || !!birthday;
  const total = data.adultes + data.enfants + data.visiteurs;
  const stepKey = visitor ? `visitor-${visitor.id}` : birthday ? `birthday-${step.kind === "birthday" ? step.key : ""}` : "counts";

  return (
    <div className={`bg-grain fixed inset-0 flex flex-col overflow-hidden transition-colors duration-[1500ms] ${golden ? "bg-gold text-night" : "bg-night text-white"}`}>
      {/* Lueurs qui dérivent lentement */}
      <div aria-hidden="true" className={`drift pointer-events-none absolute -top-[20vh] -left-[10vw] h-[70vh] w-[70vh] rounded-full blur-3xl ${golden ? "bg-white/40" : "bg-accent/40"}`} />
      <div aria-hidden="true" className={`drift-slow pointer-events-none absolute -right-[10vw] -bottom-[25vh] h-[80vh] w-[80vh] rounded-full blur-3xl ${golden ? "bg-night/10" : "bg-gold/15"}`} />
      {festive && <Confetti key={`confetti-${stepKey}`} colors={golden ? ["#00296b", "#ffffff", "#003f88", "#fff6c2"] : ["#fdc500", "#ffffff", "#ffd500", "#9cc3ff"]} />}
      <div className={`relative h-2 ${golden ? "bg-night" : "bg-gradient-to-r from-gold via-gold-strong to-gold"}`} />

      <header className="relative flex items-center justify-between px-[4vw] pt-[3vh]">
        <div className="flex items-center gap-[1.2vw]">
          <Logo size={56} />
          <div>
            <p className="font-display-italic text-[clamp(1.5rem,3.2vw,3.2rem)] leading-none">{title}</p>
            <p className={`mt-2 text-[clamp(0.7rem,1.2vw,1.2rem)] font-semibold uppercase tracking-[0.28em] capitalize ${golden ? "text-night/70" : "text-gold"}`}>{dateLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-[clamp(1.5rem,3vw,3rem)] leading-none tabular-nums">{clock}</p>
          <p className={`mt-2 inline-flex items-center gap-3 text-[clamp(0.6rem,1vw,1rem)] font-semibold uppercase tracking-[0.2em] ${golden ? "text-night/60" : "text-white/60"}`}>
            <span className={`h-3 w-3 rounded-full ${online ? `animate-pulse ${golden ? "bg-night" : "bg-gold"}` : "bg-red-500"}`} /> {online ? "En direct" : "Hors ligne"}
          </p>
        </div>
      </header>

      {visitor ? (
        <main key={stepKey} className="screen-in relative flex flex-1 flex-col items-center justify-center px-[4vw] pb-[6vh] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.35em] text-night/60">Nous sommes heureux de vous accueillir</p>
          <p className="mt-[1vh] font-display text-[clamp(3rem,13vh,10rem)] leading-none font-semibold text-night">
            Bienvenue<span className="font-display-italic font-normal text-white"> !</span>
          </p>
          <p className="screen-in mt-[5vh] max-w-[92vw] font-display text-[clamp(3.5rem,20vh,15rem)] leading-[0.95] font-semibold text-balance text-night" style={{ animationDelay: "250ms" }}>{visitor.name}</p>
          {visitor.origin && <p className="screen-in mt-[2vh] font-display-italic text-[clamp(1.4rem,4vh,3.2rem)] text-night/70" style={{ animationDelay: "450ms" }}>{visitor.origin}</p>}
          {data.visitors.length > 1 && <p className="mt-[4vh] text-[clamp(0.6rem,1vw,1rem)] font-semibold uppercase tracking-[0.3em] text-night/50">{data.visitors.findIndex((v) => v.id === visitor.id) + 1} / {data.visitors.length}</p>}
        </main>
      ) : birthday ? (
        <main key={stepKey} className="screen-in relative flex flex-1 flex-col items-center justify-center px-[4vw] pb-[6vh] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.35em] text-white/70">Cette semaine, nous fêtons</p>
          <p className="mt-[1vh] font-display text-[clamp(3rem,13vh,10rem)] leading-none font-semibold text-gold">
            Joyeux anniversaire<span className="font-display-italic font-normal text-white"> !</span>
          </p>
          <p className="screen-in mt-[5vh] max-w-[92vw] font-display text-[clamp(3.5rem,20vh,15rem)] leading-[0.95] font-semibold text-balance" style={{ animationDelay: "250ms" }}>{birthday.name}</p>
          <p className="screen-in mt-[2vh] inline-flex items-center gap-3 font-display-italic text-[clamp(1.4rem,4vh,3.2rem)] text-gold" style={{ animationDelay: "450ms" }}>
            <Cake className="h-[1em] w-[1em]" /> {birthday.label}
          </p>
        </main>
      ) : (
        <main key="counts" className="screen-in relative flex flex-1 flex-col items-center justify-center px-[4vw] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.35em] text-white/70">Avec nous ce Sabbat</p>
          <p key={total} className="pop font-display text-[clamp(8rem,32vh,24rem)] leading-none font-semibold tabular-nums text-gold">{total}</p>
          <p className="font-display-italic text-[clamp(1.2rem,2.5vw,2.5rem)] text-white/80">{total > 1 ? "personnes" : "personne"}</p>
        </main>
      )}

      <footer className="relative px-[4vw] pb-[3vh]">
        {!festive && (
          <div className="grid grid-cols-3 gap-[2vw]">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="rounded-[2vw] border border-white/10 bg-white/5 px-[2vw] py-[2.5vh] text-center backdrop-blur">
                <p className="text-[clamp(0.7rem,1.3vw,1.3rem)] font-semibold uppercase tracking-[0.28em] text-gold">{CATEGORY_LABELS[cat]}</p>
                <p key={data[cat]} className="pop mt-2 font-display text-[clamp(2.5rem,9vh,6.5rem)] leading-none font-semibold tabular-nums">{data[cat]}</p>
              </div>
            ))}
          </div>
        )}
        {/* Barre de progression de l'écran en cours (compteurs → visiteurs → anniversaires) */}
        {seq.length > 1 && (
          <div className={`mt-[2vh] h-1 overflow-hidden rounded-full ${golden ? "bg-night/15" : "bg-white/10"}`}>
            <div key={stepIndex} className={`cycle-bar h-full ${golden ? "bg-night/70" : "bg-gold/80"}`} style={{ "--cycle": `${step.kind === "counts" ? COUNTS_MS : NAME_MS}ms` } as React.CSSProperties} />
          </div>
        )}
      </footer>
    </div>
  );
}

/** Confettis en CSS (positions pseudo-aléatoires mais stables entre serveur et client). */
function Confetti({ colors }: { colors: string[] }) {
  const rnd = (i: number, n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const pieces = Array.from({ length: 56 }, (_, i) => ({
    left: rnd(i, 1) * 100,
    delay: rnd(i, 2) * 8,
    duration: 7 + rnd(i, 3) * 6,
    size: 8 + rnd(i, 4) * 12,
    color: colors[i % colors.length],
    shape: i % 3,
  }));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti absolute block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === 1 ? p.size * 0.45 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 2 ? "50%" : 2,
            animationDelay: `-${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
