import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { attendanceLive, db, sabbathVisitors, servicesAttendance } from "@/db";
import { getBirthdaysOfWeek } from "./birthdays";
import { addDays, CATEGORIES, type Category, type LiveCounts, type LiveScreenData, type Visitor, sabbathDate, todayDate } from "./sabbath";

/** Compteurs en direct du Sabbat (lecture directe, jamais mise en cache). */
export async function getLiveCounts(date = sabbathDate()): Promise<LiveCounts> {
  const rows = await db.select().from(attendanceLive).where(eq(attendanceLive.date, date));
  const get = (c: string) => rows.find((r) => r.category === c)?.count ?? 0;
  const [adultes, enfants, visiteurs] = CATEGORIES.map(get);
  const last = rows.reduce<Date | null>((m, r) => (!m || r.updatedAt > m ? r.updatedAt : m), null);
  return { date, adultes, enfants, visiteurs, total: adultes + enfants + visiteurs, updatedAt: last ? last.toISOString() : null };
}

/** Dernière présence clôturée (la plus récente par date). */
export async function getLastAttendance() {
  const [row] = await db.select().from(servicesAttendance).orderBy(desc(servicesAttendance.date)).limit(1);
  return row ?? null;
}

/** Présence clôturée pour une date donnée. */
export async function getClosedAttendance(date: string) {
  const [row] = await db.select().from(servicesAttendance).where(eq(servicesAttendance.date, date)).limit(1);
  return row ?? null;
}

/** Historique des présences (les plus récentes d'abord). */
export async function getAttendanceHistory(limit = 12) {
  return db.select().from(servicesAttendance).orderBy(desc(servicesAttendance.date)).limit(limit);
}

/** Visiteurs inscrits pour un Sabbat (ordre d'inscription). */
export async function getVisitors(date = sabbathDate()): Promise<Visitor[]> {
  return db
    .select({ id: sabbathVisitors.id, name: sabbathVisitors.name, origin: sabbathVisitors.origin })
    .from(sabbathVisitors)
    .where(eq(sabbathVisitors.date, date))
    .orderBy(asc(sabbathVisitors.id));
}

/** Compteurs + visiteurs : ce que l'écran et /api/comptage renvoient. */
export async function getScreenData(date = sabbathDate()): Promise<LiveScreenData> {
  const [counts, visitors, birthdays] = await Promise.all([getLiveCounts(date), getVisitors(date), getBirthdaysOfWeek(date)]);
  return { ...counts, visitors, birthdays };
}

/**
 * +delta sur une catégorie du Sabbat, en SQL (`count = GREATEST(count + delta, 0)`) :
 * plusieurs personnes peuvent compter en même temps sans perdre de clic.
 */
export async function incrementLive(category: Category, delta: number, date = sabbathDate()) {
  await db
    .insert(attendanceLive)
    .values({ date, category, count: Math.max(delta, 0) })
    .onConflictDoUpdate({
      target: [attendanceLive.date, attendanceLive.category],
      set: { count: sql`GREATEST(${attendanceLive.count} + ${delta}, 0)`, updatedAt: new Date() },
    });
}

/** Sabbat le plus récent : aujourd'hui si l'on est samedi (heure d'Indianapolis), sinon le samedi passé. */
export function lastSabbathDate(now = new Date()) {
  const sabbath = sabbathDate(now);
  return sabbath === todayDate(now) ? sabbath : addDays(sabbath, -7);
}

/**
 * Clôture : copie les totaux en direct d'un Sabbat dans l'historique (`services_attendance`).
 * - `replace` (clôture manuelle) : remplace une clôture précédente du même Sabbat.
 * - `keep` (clôture automatique) : ne touche pas à une clôture déjà faite.
 * Renvoie les compteurs et si une ligne a été écrite.
 */
export async function closeSabbath(date: string, closedBy: string, mode: "replace" | "keep"): Promise<{ counts: LiveCounts; closed: boolean }> {
  const counts = await getLiveCounts(date);
  const values = { adultes: counts.adultes, enfants: counts.enfants, visiteurs: counts.visiteurs, total: counts.total, closedBy, closedAt: new Date() };
  const insert = db.insert(servicesAttendance).values({ date, ...values });
  const rows =
    mode === "replace"
      ? await insert.onConflictDoUpdate({ target: servicesAttendance.date, set: values }).returning({ id: servicesAttendance.id })
      : await insert.onConflictDoNothing().returning({ id: servicesAttendance.id });
  return { counts, closed: rows.length > 0 };
}
