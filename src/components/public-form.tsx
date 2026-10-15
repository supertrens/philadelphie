"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type FormState = { ok: boolean; error?: string } | null;

export const fieldClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{children}</label>;
}

/** Champ piège invisible pour les robots : s'il est rempli, l'envoi est ignoré. */
export function Honeypot() {
  return (
    <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
      <label>Site web<input type="text" name="site_web" tabIndex={-1} autoComplete="off" /></label>
    </div>
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
