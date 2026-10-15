"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, sabbathVisitors } from "@/db";
import { logAction } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { getScreenData, incrementLive } from "@/lib/comptage";
import { type LiveScreenData, sabbathDate } from "@/lib/sabbath";

const PATHS = ["/espace/comptage", "/espace/secretariat"];
const clean = (v: unknown) => String(v ?? "").trim();

/**
 * Inscrit un visiteur du Sabbat (nom affiché sur l'écran de bienvenue) et
 * ajoute +1 au compteur « visiteurs » : une seule saisie, pas de double compte.
 */
export async function registerVisitor(input: { name: string; origin?: string; birthday?: string }): Promise<LiveScreenData> {
  const staff = await requireStaff();
  const name = clean(input.name);
  const date = sabbathDate();
  if (!name) return getScreenData(date);
  await db.insert(sabbathVisitors).values({ date, name, origin: clean(input.origin) || null, birthday: clean(input.birthday) || null, createdBy: staff.name });
  await incrementLive("visiteurs", 1, date);
  await logAction(staff, "ajout", "visiteur");
  for (const p of PATHS) revalidatePath(p);
  return getScreenData(date);
}

/** Retire un visiteur inscrit et enlève 1 au compteur « visiteurs ». */
export async function removeVisitor(id: number): Promise<LiveScreenData> {
  const staff = await requireStaff();
  const [row] = await db.delete(sabbathVisitors).where(eq(sabbathVisitors.id, id)).returning({ date: sabbathVisitors.date });
  if (row) {
    await incrementLive("visiteurs", -1, row.date);
    await logAction(staff, "suppression", "visiteur", id);
  }
  for (const p of PATHS) revalidatePath(p);
  return getScreenData();
}
