import type { Locale } from "@/i18n/locales";

const TZ = "America/Indiana/Indianapolis";
const tag = (lang: Locale) => (lang === "fr" ? "fr-FR" : "en-US");

/** « samedi 12 octobre 2026 » / "Saturday, October 12, 2026" */
export function longDate(d: Date, lang: Locale) {
  return new Intl.DateTimeFormat(tag(lang), { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** « 12 oct. 2026 » / "Oct 12, 2026" */
export function shortDate(d: Date, lang: Locale) {
  return new Intl.DateTimeFormat(tag(lang), { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** Jour, mois, jour de la semaine et heure séparés (agenda). */
export function dateParts(d: Date, lang: Locale) {
  const f = new Intl.DateTimeFormat(tag(lang), { timeZone: TZ, day: "2-digit", month: "short", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: lang === "en" });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const time = lang === "fr" ? `${p.hour}h${p.minute}` : `${p.hour}:${p.minute} ${p.dayPeriod ?? ""}`.trim();
  return { day: p.day, month: p.month.replace(".", ""), weekday: p.weekday, time };
}
