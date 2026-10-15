"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, prayerRequests, sermonPlans, visits } from "@/db";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";

const PATH = "/espace/pastorat";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function setPrayerStatus(id: number, status: "nouveau" | "en_priere" | "exauce") {
  const staff = await requireRole("pastorat");
  await db.update(prayerRequests).set({ status }).where(eq(prayerRequests.id, id));
  await logAction(staff, `prière : ${status}`, "priere", id);
  revalidatePath(PATH);
  revalidatePath("/espace");
}

export async function deletePrayer(id: number) {
  const staff = await requireRole("pastorat");
  await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
  await logAction(staff, "suppression", "priere", id);
  revalidatePath(PATH);
}

export async function addPrayer(formData: FormData) {
  // Saisie manuelle d'une demande reçue en personne ou par téléphone
  const staff = await requireRole("pastorat");
  const message = text(formData, "message");
  if (!message) return;
  await db.insert(prayerRequests).values({
    name: text(formData, "name") || null,
    message,
    isPrivate: formData.get("isPrivate") === "on",
  });
  await logAction(staff, "ajout", "priere");
  revalidatePath(PATH);
}

export async function addVisit(formData: FormData) {
  const staff = await requireRole("pastorat");
  const personName = text(formData, "personName");
  const date = parseLocalDateTime(text(formData, "date"));
  if (!personName || !date) return;
  await db.insert(visits).values({ personName, date, visitedBy: text(formData, "visitedBy") || staff.name, notes: text(formData, "notes") || null });
  await logAction(staff, "ajout", "visite");
  revalidatePath(PATH);
}

export async function deleteVisit(id: number) {
  const staff = await requireRole("pastorat");
  await db.delete(visits).where(eq(visits.id, id));
  await logAction(staff, "suppression", "visite", id);
  revalidatePath(PATH);
}

export async function addSermonPlan(formData: FormData) {
  const staff = await requireRole("pastorat");
  const date = parseLocalDateTime(text(formData, "date"));
  const speaker = text(formData, "speaker");
  if (!date || !speaker) return;
  await db.insert(sermonPlans).values({ date, speaker, title: text(formData, "title") || null, scripture: text(formData, "scripture") || null, notes: text(formData, "notes") || null });
  await logAction(staff, "ajout", "planning message");
  revalidatePath(PATH);
}

export async function deleteSermonPlan(id: number) {
  const staff = await requireRole("pastorat");
  await db.delete(sermonPlans).where(eq(sermonPlans.id, id));
  await logAction(staff, "suppression", "planning message", id);
  revalidatePath(PATH);
}
