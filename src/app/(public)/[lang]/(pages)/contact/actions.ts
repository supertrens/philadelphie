"use server";

import { eglise } from "@/config/eglise";
import { contactMessages, db } from "@/db";
import { isEmptySubmission, spamCheck } from "@/lib/anti-spam";
import { emailLayout, sendEmail } from "@/lib/email";
import type { FormState } from "@/components/public-form";

const text = (f: FormData, k: string, max = 4000) => String(f.get(k) ?? "").trim().slice(0, max);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  // Réinitialisation du formulaire (« Envoyer un autre message ») : pas d'envoi
  if (isEmptySubmission(formData)) return null;
  // Anti-spam : robot (champ piège rempli) → on fait comme si tout s'était bien passé ; trop rapide → refus
  const spam = spamCheck(formData);
  if (spam === "bot") return { ok: true };
  if (spam === "fast") return { ok: false, error: "tooFast" };
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 200);
  const subject = text(formData, "subject", 160);
  const message = text(formData, "message");
  const phone = text(formData, "phone", 40) || null;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !subject || message.length < 5) return { ok: false, error: "fields" };

  await db.insert(contactMessages).values({ name, email, phone, subject, message });

  await sendEmail({
    to: process.env.NOTIFY_EMAIL ?? eglise.email,
    subject: `[Site] ${subject} — ${name}`,
    replyTo: email,
    html: emailLayout(
      "Nouveau message depuis le site",
      `<p><strong>De :</strong> ${esc(name)} &lt;${esc(email)}&gt;${phone ? ` · ${esc(phone)}` : ""}</p>
       <p><strong>Sujet :</strong> ${esc(subject)}</p>
       <blockquote style="border-left:4px solid #fdc500;margin:16px 0;padding:8px 16px;white-space:pre-line">${esc(message)}</blockquote>
       <p><a href="${eglise.siteUrl}/espace/secretariat">Ouvrir l’espace Secrétariat</a></p>`,
    ),
  });
  return { ok: true };
}
