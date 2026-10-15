import "server-only";

/** Délai minimal entre l'affichage du formulaire et son envoi : un humain met plus de 3 s. */
export const MIN_FILL_MS = 3000;

export type SpamVerdict = "bot" | "fast" | null;

/**
 * Vérifie les champs anti-spam ajoutés par `<Honeypot />` :
 * - `website` : champ caché que seuls les robots remplissent → `"bot"` (à ignorer en silence) ;
 * - `ts` : horodatage (ms) posé au rendu ; absent, invalide ou trop récent → `"fast"` (à refuser).
 */
export function spamCheck(formData: FormData): SpamVerdict {
  if (String(formData.get("website") ?? "").trim()) return "bot";
  const ts = Number(formData.get("ts"));
  if (!Number.isFinite(ts) || ts <= 0) return "fast";
  const elapsed = Date.now() - ts;
  if (elapsed < MIN_FILL_MS) return "fast";
  return null;
}

/** Vrai si le formulaire est vide (réinitialisation après « Envoyer un autre message »). */
export function isEmptySubmission(formData: FormData) {
  return [...formData.keys()].length === 0;
}
