"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, type LiveCounts } from "@/lib/sabbath";

/** Affichage plein écran pour une télévision : rafraîchi toutes les 5 secondes. */
export function Screen({ initial, title, dateLabel }: { initial: LiveCounts; title: string; dateLabel: string }) {
  const [counts, setCounts] = useState(initial);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/comptage", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as LiveCounts;
        if (active) {
          setCounts(data);
          setOnline(true);
        }
      } catch {
        if (active) setOnline(false);
      }
    };
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const total = counts.adultes + counts.enfants + counts.visiteurs;

  return (
    <div className="bg-grain fixed inset-0 flex flex-col overflow-hidden bg-night text-white">
      <div className="h-2 bg-gradient-to-r from-gold via-gold-strong to-gold" />
      <header className="flex items-center justify-between px-[4vw] pt-[3vh]">
        <div>
          <p className="font-display-italic text-[clamp(1.5rem,3.5vw,3.5rem)] leading-none">{title}</p>
          <p className="mt-2 text-[clamp(0.7rem,1.3vw,1.3rem)] font-semibold uppercase tracking-[0.28em] text-gold capitalize">{dateLabel}</p>
        </div>
        <span className="inline-flex items-center gap-3 text-[clamp(0.6rem,1vw,1rem)] font-semibold uppercase tracking-[0.2em] text-white/60">
          <span className={`h-3 w-3 rounded-full ${online ? "animate-pulse bg-gold" : "bg-red-500"}`} /> {online ? "En direct" : "Hors ligne"}
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-[4vw] text-center">
        <p className="text-[clamp(0.8rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.35em] text-white/70">Avec nous ce Sabbat</p>
        <p className="font-display text-[clamp(8rem,30vh,22rem)] leading-none font-semibold tabular-nums text-gold">{total}</p>
        <p className="font-display-italic text-[clamp(1.2rem,2.5vw,2.5rem)] text-white/80">{total > 1 ? "personnes" : "personne"}</p>
      </main>

      <footer className="grid grid-cols-3 gap-[2vw] px-[4vw] pb-[4vh]">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="rounded-[2vw] border border-white/10 bg-white/5 px-[2vw] py-[3vh] text-center backdrop-blur">
            <p className="text-[clamp(0.7rem,1.3vw,1.3rem)] font-semibold uppercase tracking-[0.28em] text-gold">{CATEGORY_LABELS[cat]}</p>
            <p className="mt-2 font-display text-[clamp(3rem,10vh,7rem)] leading-none font-semibold tabular-nums">{counts[cat]}</p>
          </div>
        ))}
      </footer>
    </div>
  );
}
