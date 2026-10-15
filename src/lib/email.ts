import "server-only";
import { Resend } from "resend";
import { eglise } from "@/config/eglise";

const FROM = process.env.EMAIL_FROM ?? `${eglise.nom} <no-reply@philadelphiesdachurch.com>`;

/**
 * Envoie un e-mail via Resend. Sans RESEND_API_KEY (ex. en local),
 * l'envoi est simplement ignoré et consigné dans la console.
 */
export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email ignoré] à ${opts.to} — ${opts.subject}`);
    return { skipped: true as const };
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
  if (error) console.error("[email] échec :", error);
  return { skipped: false as const, error };
}

/** Gabarit bleu/or minimal. */
export function emailLayout(title: string, body: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f7fb;font-family:Inter,Arial,sans-serif;color:#0b1b33">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e2d8">
    <div style="background:#00296b;color:#fff;padding:20px 28px;border-bottom:4px solid #fdc500">
      <strong style="font-size:18px">${eglise.nom}</strong>
    </div>
    <div style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 28px;font-size:12px;color:#55627a;border-top:1px solid #e6e2d8">${eglise.adresse}</div>
  </div></body></html>`;
}
