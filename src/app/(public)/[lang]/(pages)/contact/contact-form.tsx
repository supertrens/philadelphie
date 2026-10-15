"use client";

import { useActionState, useEffect, useRef } from "react";
import { fieldClass, Honeypot, Label, SubmitButton, ThankYou } from "@/components/public-form";
import { sendContactMessage } from "./actions";

type T = (typeof import("@/i18n/fr.json"))["contactPage"] & { sending: string; errorGeneric: string; tooFast: string };

export function ContactForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  if (state?.ok && !pending) {
    return <ThankYou title={t.thanksTitle} text={t.thanksText} another={t.another} onReset={() => action(new FormData())} />;
  }
  return (
    <form ref={ref} action={action} className="relative grid gap-5 rounded-[2rem] bg-surface p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="c-name">{t.name} *</Label><input id="c-name" name="name" required maxLength={120} autoComplete="name" className={fieldClass} /></div>
        <div><Label htmlFor="c-email">{t.email} *</Label><input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" className={fieldClass} /></div>
        <div><Label htmlFor="c-phone">{t.phone}</Label><input id="c-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={fieldClass} /></div>
        <div>
          <Label htmlFor="c-subject">{t.subject} *</Label>
          <select id="c-subject" name="subject" required defaultValue="" className={fieldClass}>
            <option value="" disabled>—</option>
            {t.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="c-message">{t.message} *</Label>
        <textarea id="c-message" name="message" required minLength={5} maxLength={4000} rows={6} className={fieldClass} />
        {state && !state.ok && <p className="mt-2 text-sm text-red-700">{state.error === "tooFast" ? t.tooFast : t.errorGeneric}</p>}
      </div>
      <div className="flex justify-end"><SubmitButton label={t.submit} sending={t.sending} /></div>
    </form>
  );
}
