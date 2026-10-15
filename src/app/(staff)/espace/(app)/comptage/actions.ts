"use server";

import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { closeSabbath, getLiveCounts, incrementLive, resetSabbath } from "@/lib/comptage";
import { CATEGORIES, type Category, type LiveCounts, sabbathDate } from "@/lib/sabbath";

/**
 * +1 / −1 sur une catégorie du Sabbat en cours. L'incrément est fait en SQL
 * (`count = count + delta`) : plusieurs compteurs peuvent cliquer en même temps.
 */
export async function bump(category: Category, delta: 1 | -1): Promise<LiveCounts> {
  await requireStaff();
  if (!CATEGORIES.includes(category) || (delta !== 1 && delta !== -1)) throw new Error("Valeur invalide");
  const date = sabbathDate();
  await incrementLive(category, delta, date);
  return getLiveCounts(date);
}

/** Clôture : copie les totaux du jour dans l'historique (remplace une clôture précédente du même Sabbat). */
export async function closeDay() {
  const staff = await requireStaff();
  const { counts: c } = await closeSabbath(sabbathDate(), staff.name, "replace");
  await logAction(staff, `clôture comptage (${c.total})`, "presence", c.date);
  revalidatePath("/espace/comptage");
  revalidatePath("/espace/secretariat");
  revalidatePath("/espace");
}

/** Remise à zéro : efface les compteurs et les visiteurs inscrits du Sabbat en cours (avant un vrai comptage, après des essais). */
export async function resetDay() {
  const staff = await requireStaff();
  const date = sabbathDate();
  await resetSabbath(date);
  await logAction(staff, "remise à zéro comptage", "presence", date);
  revalidatePath("/espace/comptage");
  revalidatePath("/espace/secretariat");
}
