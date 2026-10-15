"use client";

import { Minus, Plus, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABELS, type Category, type LiveScreenData } from "@/lib/sabbath";
import { registerVisitor, removeVisitor } from "@/lib/visitors/actions";
import { bump } from "./actions";

/**
 * Gros boutons +1 / −1 par catégorie, affichage optimiste, resynchronisation
 * toutes les 5 s. Le « + » des visiteurs demande le nom (facultatif) : il est
 * inscrit pour l'écran de bienvenue et compté en même temps.
 */
export function Counter({ initial }: { initial: LiveScreenData }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const pending = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  /** Exécute une mutation serveur avec mise à jour optimiste puis reprise des valeurs du serveur. */
  async function run(optimistic: (d: LiveScreenData) => LiveScreenData, action: () => Promise<LiveScreenData | { adultes: number; enfants: number; visiteurs: number }>) {
    setError("");
    const before = data;
    setData(optimistic);
    pending.current += 1;
    try {
      const fresh = await action();
      if (pending.current === 1) setData((d) => ({ ...d, ...fresh }));
    } catch {
      setData(before);
      setError("Impossible d'enregistrer, vérifiez la connexion.");
    } finally {
      pending.current -= 1;
    }
  }

  function change(category: Category, delta: 1 | -1) {
    if (delta < 0 && data[category] <= 0) return;
    run((d) => ({ ...d, [category]: Math.max(d[category] + delta, 0) }), () => bump(category, delta));
  }

  function addVisitor(form: HTMLFormElement) {
    const f = new FormData(form);
    const name = String(f.get("name") ?? "").trim();
    const origin = String(f.get("origin") ?? "").trim();
    const birthday = String(f.get("birthday") ?? "").trim();
    dialog.current?.close();
    form.reset();
    if (!name) {
      change("visiteurs", 1);
      return;
    }
    run(
      (d) => ({ ...d, visiteurs: d.visiteurs + 1, visitors: [...d.visitors, { id: -Date.now(), name, origin: origin || null }] }),
      () => registerVisitor({ name, origin, birthday }),
    );
  }

  function dropVisitor(id: number) {
    run((d) => ({ ...d, visiteurs: Math.max(d.visiteurs - 1, 0), visitors: d.visitors.filter((v) => v.id !== id) }), () => removeVisitor(id));
  }

  // Resynchronisation (plusieurs personnes peuvent compter en même temps)
  useEffect(() => {
    const id = setInterval(async () => {
      if (pending.current > 0) return;
      try {
        const res = await fetch("/api/comptage", { cache: "no-store" });
        if (res.ok) setData((await res.json()) as LiveScreenData);
      } catch {
        /* réessaie au prochain tour */
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const total = data.adultes + data.enfants + data.visiteurs;

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
            <p className="mt-2 font-display text-6xl leading-none font-semibold text-night tabular-nums sm:text-7xl">{data[cat]}</p>
            <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3">
              <button
                type="button"
                onClick={() => change(cat, -1)}
                disabled={data[cat] <= 0}
                aria-label={`Retirer une personne (${CATEGORY_LABELS[cat]})`}
                className="grid h-20 place-items-center rounded-2xl border-2 border-line text-ink transition hover:bg-subtle active:scale-95 disabled:opacity-40"
              >
                <Minus className="h-8 w-8" />
              </button>
              {cat === "visiteurs" ? (
                <button
                  type="button"
                  onClick={() => { dialog.current?.showModal(); nameInput.current?.focus(); }}
                  aria-label="Ajouter un visiteur (avec son nom)"
                  className="grid h-20 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/25 transition hover:bg-accent-strong active:scale-95"
                >
                  <span className="flex items-center gap-2"><Plus className="h-10 w-10" /><UserPlus className="h-7 w-7 opacity-80" /></span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => change(cat, 1)}
                  aria-label={`Ajouter une personne (${CATEGORY_LABELS[cat]})`}
                  className="grid h-20 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/25 transition hover:bg-accent-strong active:scale-95"
                >
                  <Plus className="h-10 w-10" />
                </button>
              )}
            </div>
            {cat === "visiteurs" && (
              <div className="mt-4">
                <p className="text-xs text-muted">Le « + » demande le nom du visiteur : il s&apos;affiche sur l&apos;écran de bienvenue.</p>
                {data.visitors.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {data.visitors.map((v) => (
                      <li key={v.id} className="inline-flex items-center gap-1 rounded-full bg-subtle py-1 pr-1 pl-3 text-sm">
                        <span className="font-medium">{v.name}</span>
                        {v.origin && <span className="text-muted">· {v.origin}</span>}
                        <button type="button" onClick={() => dropVisitor(v.id)} aria-label={`Retirer ${v.name}`} className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-line hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Nom du visiteur (facultatif) */}
      <dialog ref={dialog} className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-night/60 backdrop:backdrop-blur-sm">
        <form onSubmit={(e) => { e.preventDefault(); addVisitor(e.currentTarget); }} className="flex flex-col gap-4 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Visiteur</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-night">Qui accueillons-nous ?</h2>
            <p className="mt-1 text-sm text-muted">Le nom s&apos;affichera en grand sur l&apos;écran de bienvenue. Vous pouvez aussi compter sans nom.</p>
          </div>
          <Field label="Prénom et nom"><Input ref={nameInput} name="name" placeholder="Ex. Marie Jean-Baptiste" autoComplete="off" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Venu(e) de (facultatif)"><Input name="origin" placeholder="Ex. Montréal" autoComplete="off" /></Field>
            <Field label="Anniversaire (facultatif)"><Input name="birthday" type="date" /></Field>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => { dialog.current?.close(); }}>Annuler</Button>
            <Button type="button" variant="ghost" onClick={(e) => { const form = e.currentTarget.form; if (form) { (form.elements.namedItem("name") as HTMLInputElement).value = ""; addVisitor(form); } }}>Compter sans nom</Button>
            <Button type="submit">Ajouter et compter</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
