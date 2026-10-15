"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

export type FormState = { ok: boolean; error?: string } | null;

export const fieldClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{children}</label>;
}

/**
 * Anti-spam sans CAPTCHA (vérifié côté serveur par `spamCheck`) :
 * - champ piège `website`, invisible : s'il est rempli, l'envoi est ignoré en silence ;
 * - horodatage `ts` posé au montage : un envoi moins de 3 s après l'affichage est refusé.
 */
export function Honeypot() {
  const ts = useRef<HTMLInputElement>(null);
  // Posé après le montage (et non au rendu) pour que le HTML serveur et le client restent identiques
  useEffect(() => {
    if (ts.current) ts.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Site web<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <input ref={ts} type="hidden" name="ts" defaultValue="" />
    </>
  );
}

export function SubmitButton({ label, sending }: { label: string; sending: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-3 rounded-full bg-accent py-3.5 pr-7 pl-7 text-sm font-semibold text-white shadow-xl shadow-accent/25 transition hover:bg-accent-strong disabled:opacity-60">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? sending : label}
    </button>
  );
}

export function ThankYou({ title, text, another, onReset }: { title: string; text: string; another: string; onReset: () => void }) {
  return (
    <div className="rounded-[2rem] border-l-4 border-gold bg-surface p-8 shadow-xl sm:p-10" role="status">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-night text-gold"><CheckCircle2 className="h-7 w-7" /></span>
      <h2 className="mt-6 font-display text-3xl font-semibold text-night">{title}</h2>
      <p className="mt-3 text-muted text-pretty">{text}</p>
      <button type="button" onClick={onReset} className="mt-6 text-sm font-semibold text-accent hover:underline">{another}</button>
    </div>
  );
}
