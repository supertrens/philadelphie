"use server";

import { eglise } from "@/config/eglise";
import { db, prayerRequests } from "@/db";
import { emailLayout, sendEmail } from "@/lib/email";
import type { FormState } from "@/components/public-form";

const text = (f: FormData, k: string, max = 4000) => String(f.get(k) ?? "").trim().slice(0, max);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendPrayerRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  // Piège à robots : on fait comme si tout s'était bien passé
  if (text(formData, "site_web")) return { ok: true };
  const message = text(formData, "message");
  if (message.length < 5) return { ok: false, error: "message" };
  const name = text(formData, "name", 120) || null;
  const email = text(formData, "email", 200) || null;
  const isPrivate = formData.get("confidential") === "on";

  await db.insert(prayerRequests).values({ name, email, message, isPrivate });

  const to = process.env.NOTIFY_EMAIL ?? eglise.email;
  const body = isPrivate
    ? `<p>Une <strong>demande de prière confidentielle</strong> vient d’arriver. Elle est réservée au pastorat : consultez-la dans l’espace membres.</p>`
    : `<p><strong>De :</strong> ${esc(name ?? "Anonyme")}${email ? ` &lt;${esc(email)}&gt;` : ""}</p><blockquote style="border-left:4px solid #fdc500;margin:16px 0;padding:8px 16px;white-space:pre-line">${esc(message)}</blockquote>`;
  await sendEmail({
    to,
    subject: `Demande de prière${name && !isPrivate ? ` — ${name}` : ""}`,
    html: emailLayout("Nouvelle demande de prière", `${body}<p><a href="${eglise.siteUrl}/espace/pastorat">Ouvrir l’espace Pastorat</a></p>`),
    replyTo: !isPrivate && email ? email : undefined,
  });
  return { ok: true };
}
