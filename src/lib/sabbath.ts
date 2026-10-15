import type { Locale } from "@/i18n/locales";

const TZ = "America/Indiana/Indianapolis";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Date (AAAA-MM-JJ) du Sabbat en cours ou du prochain, en heure d'Indianapolis. */
export function sabbathDate(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekday = DAYS.indexOf(parts.weekday);
  const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  d.setUTCDate(d.getUTCDate() + ((6 - weekday + 7) % 7));
  return d.toISOString().slice(0, 10);
}

/** « samedi 17 octobre 2026 » à partir d'une date AAAA-MM-JJ. */
export function formatSabbath(date: string, lang: Locale = "fr") {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export const CATEGORIES = ["adultes", "enfants", "visiteurs"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = { adultes: "Adultes", enfants: "Enfants", visiteurs: "Visiteurs" };

export type LiveCounts = { date: string; adultes: number; enfants: number; visiteurs: number; total: number; updatedAt: string | null };
