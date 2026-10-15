"use client";

import { useEffect, useState } from "react";

const TZ = "America/Indiana/Indianapolis";

type Slot = { weekday: number; hour: number; minute: number; nom: string; heure: string };

/** Prochain rendez-vous (heure d'Indianapolis) et temps restant. */
function nextSlot(slots: Slot[], now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", weekday: "short", hour: "2-digit", minute: "2-digit" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekdayNow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const minutesNow = Number(parts.hour) * 60 + Number(parts.minute);
  let best: { slot: Slot; minutes: number } | null = null;
  for (const slot of slots) {
    let delta = (slot.weekday - weekdayNow) * 1440 + slot.hour * 60 + slot.minute - minutesNow;
    // Un culte en cours (moins de 2 h après le début) reste "maintenant"
    if (delta < -120) delta += 7 * 1440;
    if (!best || delta < best.minutes) best = { slot, minutes: delta };
  }
  return best!;
}

export function Countdown({ slots }: { slots: Slot[] }) {
  const [state, setState] = useState<{ slot: Slot; minutes: number } | null>(null);
  useEffect(() => {
    const tick = () => setState(nextSlot(slots, new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [slots]);

  if (!state) return <div className="h-16" aria-hidden="true" />;
  const { slot, minutes } = state;
  const live = minutes <= 0;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const jour = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][slot.weekday];

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
        <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-red-500" : "bg-gold"}`} />
        {live ? "En ce moment" : "Prochain rendez-vous"}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold leading-tight">{slot.nom}</p>
      <p className="text-sm text-white/70">{jour} · {slot.heure}</p>
      {!live && (
        <p className="mt-3 flex gap-4 font-display text-3xl font-semibold tabular-nums" aria-label={`Dans ${days} jours ${hours} heures ${mins} minutes`}>
          {days > 0 && <span>{days}<span className="ml-1 text-sm font-normal text-white/60">j</span></span>}
          <span>{hours}<span className="ml-1 text-sm font-normal text-white/60">h</span></span>
          <span>{String(mins).padStart(2, "0")}<span className="ml-1 text-sm font-normal text-white/60">min</span></span>
        </p>
      )}
    </div>
  );
}
