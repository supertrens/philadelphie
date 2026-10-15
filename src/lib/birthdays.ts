import "server-only";
import { db, members, sabbathVisitors, teachers } from "@/db";
import { toDateInput } from "./dates";
import { addDays, type BirthdayPerson, sabbathDate, todayDate } from "./sabbath";

/** « 12 mars » à partir d'un MM-JJ. */
export function birthdayLabel(monthDay: string) {
  const [m, d] = monthDay.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "long" }).format(new Date(Date.UTC(2000, m - 1, d)));
}

/** MM-JJ d'une date stockée (Date en heure d'Indianapolis ou chaîne AAAA-MM-JJ). */
export function monthDayOf(value: Date | string | null | undefined) {
  if (!value) return null;
  const iso = typeof value === "string" ? value : toDateInput(value);
  return iso ? iso.slice(5) : null;
}

/** Toutes les personnes enregistrées avec une date de naissance (membres, jeunes, visiteurs, moniteurs). */
async function everyone(): Promise<BirthdayPerson[]> {
  const [m, v, t] = await Promise.all([
    db.select({ firstName: members.firstName, lastName: members.lastName, birthday: members.birthday, department: members.department }).from(members),
    db.select({ name: sabbathVisitors.name, birthday: sabbathVisitors.birthday }).from(sabbathVisitors),
    db.select({ name: teachers.name, birthday: teachers.birthday }).from(teachers),
  ]);
  const people: BirthdayPerson[] = [];
  const seen = new Set<string>();
  const push = (name: string, birthday: Date | string | null, role: string) => {
    const monthDay = monthDayOf(birthday);
    const key = `${name.trim().toLowerCase()}|${monthDay}`;
    if (!monthDay || seen.has(key)) return;
    seen.add(key);
    people.push({ name: name.trim(), monthDay, label: birthdayLabel(monthDay), role });
  };
  for (const x of m) push(`${x.firstName} ${x.lastName}`, x.birthday, x.department === "jeunesse" ? "Jeune" : "Membre");
  for (const x of v) push(x.name, x.birthday, "Visiteur");
  for (const x of t) push(x.name, x.birthday, "Moniteur");
  return people;
}

/** Anniversaires des `days` prochains jours (aujourd'hui inclus), triés par date. */
export async function getUpcomingBirthdays(days = 30) {
  const people = await everyone();
  const today = todayDate();
  const window = new Map<string, number>();
  for (let i = 0; i <= days; i++) window.set(addDays(today, i).slice(5), i);
  return people
    .map((p) => ({ ...p, inDays: window.get(p.monthDay) ?? -1 }))
    .filter((p) => p.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays || a.name.localeCompare(b.name, "fr"));
}

/** Anniversaires de la semaine du Sabbat (du dimanche précédent au Sabbat), pour l'écran de bienvenue. */
export async function getBirthdaysOfWeek(sabbath = sabbathDate()) {
  const people = await everyone();
  const week = new Set(Array.from({ length: 7 }, (_, i) => addDays(sabbath, i - 6).slice(5)));
  return people.filter((p) => week.has(p.monthDay)).sort((a, b) => a.monthDay.localeCompare(b.monthDay) || a.name.localeCompare(b.name, "fr"));
}
