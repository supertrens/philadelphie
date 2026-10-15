"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, type Category, type LiveCounts } from "@/lib/sabbath";
import { bump } from "./actions";

/** Gros boutons +1 / −1 par catégorie, affichage optimiste, resynchronisation toutes les 5 s. */
export function Counter({ initial }: { initial: LiveCounts }) {
  const [counts, setCounts] = useState(initial);
  const [error, setError] = useState("");
  const pending = useRef(0);

  async function change(category: Category, delta: 1 | -1) {
    if (delta < 0 && counts[category] <= 0) return;
    setError("");
    setCounts((c) => ({ ...c, [category]: Math.max(c[category] + delta, 0) }));
    pending.current += 1;
    try {
      const fresh = await bump(category, delta);
      // Ne reprend les valeurs du serveur que si aucun autre clic n'est en attente
      if (pending.current === 1) setCounts(fresh);
    } catch {
      setCounts((c) => ({ ...c, [category]: Math.max(c[category] - delta, 0) }));
      setError("Impossible d'enregistrer, vérifiez la connexion.");
    } finally {
      pending.current -= 1;
    }
  }

  // Resynchronisation (plusieurs personnes peuvent compter en même temps)
  useEffect(() => {
    const id = setInterval(async () => {
      if (pending.current > 0) return;
      try {
        const res = await fetch("/api/comptage", { cache: "no-store" });
        if (res.ok) setCounts((await res.json()) as LiveCounts);
      } catch {
        /* réessaie au prochain tour */
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const total = counts.adultes + counts.enfants + counts.visiteurs;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-night p-6 text-white shadow-xl sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Total ce Sabbat</p>
        <p className="mt-2 font-display text-7xl leading-none font-semibold tabular-nums sm:text-8xl">{total}</p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <section key={cat} className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{CATEGORY_LABELS[cat]}</p>
            <p className="mt-2 font-display text-6xl leading-none font-semibold text-night tabular-nums sm:text-7xl">{counts[cat]}</p>
            <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3">
              <button
                type="button"
                onClick={() => change(cat, -1)}
                disabled={counts[cat] <= 0}
                aria-label={`Retirer une personne (${CATEGORY_LABELS[cat]})`}
                className="grid h-20 place-items-center rounded-2xl border-2 border-line text-ink transition hover:bg-subtle active:scale-95 disabled:opacity-40"
              >
                <Minus className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={() => change(cat, 1)}
                aria-label={`Ajouter une personne (${CATEGORY_LABELS[cat]})`}
                className="grid h-20 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/25 transition hover:bg-accent-strong active:scale-95"
              >
                <Plus className="h-10 w-10" />
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
