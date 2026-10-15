"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

/** Partage natif (mobile) ou copie du lien dans le presse-papiers. */
export function ShareButton({ title, label, copied }: { title: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* annulé par l'utilisateur */
    }
  }
  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">
      {done ? <Check className="h-4 w-4 text-accent" /> : <Share2 className="h-4 w-4" />}
      {done ? copied : label}
    </button>
  );
}
