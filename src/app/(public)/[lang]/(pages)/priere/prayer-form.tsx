"use client";

import { useActionState, useEffect, useRef } from "react";
import { fieldClass, Honeypot, Label, SubmitButton, ThankYou } from "@/components/public-form";
import { sendPrayerRequest } from "./actions";

type T = (typeof import("@/i18n/fr.json"))["prayer"] & { sending: string; errorGeneric: string; required: string; tooFast: string };

export function PrayerForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState(sendPrayerRequest, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  if (state?.ok && !pending) {
    return <ThankYou title={t.thanksTitle} text={t.thanksText} another={t.another} onReset={() => action(new FormData())} />;
  }
  return (
    <form ref={ref} action={action} className="relative grid gap-5 rounded-[2rem] bg-surface p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="p-name">{t.name}</Label><input id="p-name" name="name" maxLength={120} autoComplete="given-name" className={fieldClass} /></div>
        <div><Label htmlFor="p-email">{t.email}</Label><input id="p-email" name="email" type="email" maxLength={200} autoComplete="email" className={fieldClass} /></div>
      </div>
      <div>
        <Label htmlFor="p-message">{t.message} *</Label>
        <textarea id="p-message" name="message" required minLength={5} maxLength={4000} rows={6} className={fieldClass} />
        {state && !state.ok && <p className="mt-2 text-sm text-red-700">{state.error === "message" ? t.required : state.error === "tooFast" ? t.tooFast : t.errorGeneric}</p>}
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-subtle p-4 text-sm text-ink">
        <input type="checkbox" name="confidential" className="mt-0.5 h-4 w-4 accent-accent" /> {t.confidential}
      </label>
      <div className="flex justify-end"><SubmitButton label={t.submit} sending={t.sending} /></div>
    </form>
  );
}
