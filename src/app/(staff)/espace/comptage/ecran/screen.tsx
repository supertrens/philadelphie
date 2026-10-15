"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { CATEGORIES, CATEGORY_LABELS, type LiveScreenData } from "@/lib/sabbath";

const REFRESH_MS = 5000;
/** Durée d'affichage de chaque vue (compteurs, puis visiteurs). */
const CYCLE_MS = 10000;
/** Noms de visiteurs par page de bienvenue. */
const PER_PAGE = 8;

type View = "counts" | "visitors";

/**
 * Écran plein format pour une télévision : chiffres en direct, puis toutes les
 * 10 secondes la liste des visiteurs inscrits par le secrétariat (bienvenue).
 */
export function Screen({ initial, title, dateLabel }: { initial: LiveScreenData; title: string; dateLabel: string }) {
  const [data, setData] = useState(initial);
  const [online, setOnline] = useState(true);
  const [view, setView] = useState<View>("counts");
  const [page, setPage] = useState(0);
  const [clock, setClock] = useState("");
  // Nombre de visiteurs lu par le minuteur d'alternance (sans relancer l'intervalle)
  const visitorsRef = useRef(initial.visitors.length);
  useEffect(() => {
    visitorsRef.current = data.visitors.length;
  }, [data.visitors.length]);

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

  // Alternance compteurs → visiteurs (page suivante à chaque passage) → compteurs…
  useEffect(() => {
    const id = setInterval(() => {
      const pages = Math.max(1, Math.ceil(visitorsRef.current / PER_PAGE));
      setView((v) => {
        if (visitorsRef.current === 0) return "counts";
        if (v === "counts") {
          setPage((p) => (p + 1) % pages);
          return "visitors";
        }
        return "counts";
      });
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Horloge (heure d'Indianapolis)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Indiana/Indianapolis", hour: "2-digit", minute: "2-digit" });
    const tick = () => setClock(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const total = data.adultes + data.enfants + data.visiteurs;
  const showVisitors = view === "visitors" && data.visitors.length > 0;
  const pages = Math.max(1, Math.ceil(data.visitors.length / PER_PAGE));
  const slice = data.visitors.slice((page % pages) * PER_PAGE, (page % pages) * PER_PAGE + PER_PAGE);

  return (
    <div className="bg-grain fixed inset-0 flex flex-col overflow-hidden bg-night text-white">
      {/* Lueurs qui dérivent lentement */}
      <div aria-hidden="true" className="drift pointer-events-none absolute -top-[20vh] -left-[10vw] h-[70vh] w-[70vh] rounded-full bg-accent/40 blur-3xl" />
      <div aria-hidden="true" className="drift-slow pointer-events-none absolute -right-[10vw] -bottom-[25vh] h-[80vh] w-[80vh] rounded-full bg-gold/15 blur-3xl" />
      <div className="relative h-2 bg-gradient-to-r from-gold via-gold-strong to-gold" />

      <header className="relative flex items-center justify-between px-[4vw] pt-[3vh]">
        <div className="flex items-center gap-[1.2vw]">
          <Logo size={56} />
          <div>
            <p className="font-display-italic text-[clamp(1.5rem,3.2vw,3.2rem)] leading-none">{title}</p>
            <p className="mt-2 text-[clamp(0.7rem,1.2vw,1.2rem)] font-semibold uppercase tracking-[0.28em] text-gold capitalize">{dateLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-[clamp(1.5rem,3vw,3rem)] leading-none tabular-nums">{clock}</p>
          <p className="mt-2 inline-flex items-center gap-3 text-[clamp(0.6rem,1vw,1rem)] font-semibold uppercase tracking-[0.2em] text-white/60">
            <span className={`h-3 w-3 rounded-full ${online ? "animate-pulse bg-gold" : "bg-red-500"}`} /> {online ? "En direct" : "Hors ligne"}
          </p>
        </div>
      </header>

      {showVisitors ? (
        <main key={`visitors-${page}`} className="screen-in relative flex flex-1 flex-col items-center justify-center px-[4vw] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.35em] text-white/70">Nous sommes heureux de vous accueillir</p>
          <p className="mt-[1vh] font-display text-[clamp(3.5rem,12vh,9rem)] leading-none font-semibold text-gold">
            Bienvenue<span className="font-display-italic font-normal text-white"> !</span>
          </p>
          <ul className={`mt-[4vh] grid w-full max-w-[90vw] gap-x-[4vw] gap-y-[1.5vh] ${slice.length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
            {slice.map((v, i) => (
              <li key={v.id} className="screen-in" style={{ animationDelay: `${120 + i * 110}ms` }}>
                <p className={`font-display leading-tight font-semibold ${slice.length > 4 ? "text-[clamp(2rem,6.5vh,5rem)]" : "text-[clamp(2.5rem,9vh,7rem)]"}`}>{v.name}</p>
                {v.origin && <p className="font-display-italic text-[clamp(1rem,2.6vh,2rem)] text-gold">{v.origin}</p>}
              </li>
            ))}
          </ul>
          {pages > 1 && <p className="mt-[3vh] text-[clamp(0.6rem,1vw,1rem)] font-semibold uppercase tracking-[0.3em] text-white/50">{(page % pages) + 1} / {pages}</p>}
        </main>
      ) : (
        <main key="counts" className="screen-in relative flex flex-1 flex-col items-center justify-center px-[4vw] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.35em] text-white/70">Avec nous ce Sabbat</p>
          <p key={total} className="pop font-display text-[clamp(8rem,32vh,24rem)] leading-none font-semibold tabular-nums text-gold">{total}</p>
          <p className="font-display-italic text-[clamp(1.2rem,2.5vw,2.5rem)] text-white/80">{total > 1 ? "personnes" : "personne"}</p>
        </main>
      )}

      <footer className="relative px-[4vw] pb-[3vh]">
        <div className="grid grid-cols-3 gap-[2vw]">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-[2vw] border border-white/10 bg-white/5 px-[2vw] py-[2.5vh] text-center backdrop-blur">
              <p className="text-[clamp(0.7rem,1.3vw,1.3rem)] font-semibold uppercase tracking-[0.28em] text-gold">{CATEGORY_LABELS[cat]}</p>
              <p key={data[cat]} className="pop mt-2 font-display text-[clamp(2.5rem,9vh,6.5rem)] leading-none font-semibold tabular-nums">{data[cat]}</p>
            </div>
          ))}
        </div>
        {/* Barre de progression du cycle (compteurs ⇄ visiteurs) */}
        {data.visitors.length > 0 && (
          <div className="mt-[2vh] h-1 overflow-hidden rounded-full bg-white/10">
            <div key={`${view}-${page}`} className="cycle-bar h-full bg-gold/80" style={{ "--cycle": `${CYCLE_MS}ms` } as React.CSSProperties} />
          </div>
        )}
      </footer>
    </div>
  );
}
