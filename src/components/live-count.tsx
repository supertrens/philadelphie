"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

/** « X personnes avec nous ce matin » : interroge /api/comptage/public toutes les 5 s. */
export function LiveCount({ one, many }: { one: string; many: string }) {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/comptage/public", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number };
        if (active && typeof data.total === "number") setTotal(data.total);
      } catch {
        /* réessaie au prochain tour */
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);
  if (!total) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-night px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
      <Users className="h-3.5 w-3.5" /> {total === 1 ? one : many.replace("{n}", String(total))}
    </span>
  );
}
