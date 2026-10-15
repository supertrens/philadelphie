/**
 * Jeton d'accès de l'écran TV (variable d'environnement SCREEN_TOKEN).
 * Permet d'afficher /espace/comptage/ecran?k=<jeton> et d'interroger
 * /api/comptage?k=<jeton> sans session Clerk (mode kiosque). Sans jeton
 * configuré, l'écran reste réservé au personnel connecté.
 *
 * Importé par le proxy (pas de `server-only`, qui n'y est pas accepté).
 */
export function screenToken(): string | null {
  const t = process.env.SCREEN_TOKEN?.trim();
  return t ? t : null;
}

/** Vrai si un jeton est configuré et que `k` lui est strictement égal. */
export function isValidScreenToken(k: string | null | undefined): boolean {
  const t = screenToken();
  return t !== null && typeof k === "string" && k === t;
}
