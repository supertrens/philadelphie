"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { attendanceLive, db, servicesAttendance } from "@/db";
import { logAction } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { getLiveCounts } from "@/lib/comptage";
import { CATEGORIES, type Category, type LiveCounts, sabbathDate } from "@/lib/sabbath";

/**
 * +1 / −1 sur une catégorie du Sabbat en cours. L'incrément est fait en SQL
 * (`count = count + delta`) : plusieurs compteurs peuvent cliquer en même temps.
 */
export async function bump(category: Category, delta: 1 | -1): Promise<LiveCounts> {
  await requireStaff();
  if (!CATEGORIES.includes(category) || (delta !== 1 && delta !== -1)) throw new Error("Valeur invalide");
  const date = sabbathDate();
  await db
    .insert(attendanceLive)
    .values({ date, category, count: Math.max(delta, 0) })
    .onConflictDoUpdate({
      target: [attendanceLive.date, attendanceLive.category],
      set: { count: sql`GREATEST(${attendanceLive.count} + ${delta}, 0)`, updatedAt: new Date() },
    });
  return getLiveCounts(date);
}

/** Clôture : copie les totaux du jour dans l'historique (remplace une clôture précédente du même Sabbat). */
export async function closeDay() {
  const staff = await requireStaff();
  const c = await getLiveCounts();
  const values = { adultes: c.adultes, enfants: c.enfants, visiteurs: c.visiteurs, total: c.total, closedBy: staff.name, closedAt: new Date() };
  await db
    .insert(servicesAttendance)
    .values({ date: c.date, ...values })
    .onConflictDoUpdate({ target: servicesAttendance.date, set: values });
  await logAction(staff, `clôture comptage (${c.total})`, "presence", c.date);
  revalidatePath("/espace/comptage");
  revalidatePath("/espace/secretariat");
  revalidatePath("/espace");
}
