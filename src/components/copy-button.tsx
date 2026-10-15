"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

/** Copie un texte dans le presse-papiers et confirme pendant deux secondes. */
export function CopyButton({ text, label = "Copier", copied = "Copié !" }: { text: string; label?: string; copied?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* presse-papiers indisponible : l'utilisateur peut sélectionner le texte */
    }
  }
  return (
    <Button type="button" variant="ghost" onClick={copy}>
      {done ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
      {done ? copied : label}
    </Button>
  );
}
