export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function hasLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Langue préférée : cookie, puis en-tête Accept-Language. */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale | null {
  if (hasLocale(cookie)) return cookie;
  if (!acceptLanguage) return null;
  const wanted = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const w of wanted) if (hasLocale(w.lang)) return w.lang;
  return null;
}
