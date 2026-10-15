import "server-only";
import { desc, eq } from "drizzle-orm";
import { attendanceLive, db, servicesAttendance } from "@/db";
import { CATEGORIES, type LiveCounts, sabbathDate } from "./sabbath";

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
