"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { classSessions, classes, db, teachers } from "@/db";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";

const PATH = "/espace/enfants";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function addClass(formData: FormData) {
  const staff = await requireRole("enfants");
  const name = text(formData, "name");
  if (!name) return;
  await db.insert(classes).values({ name, ageRange: text(formData, "ageRange") || null, room: text(formData, "room") || null });
  await logAction(staff, "ajout", "classe");
  revalidatePath(PATH);
}

export async function deleteClass(id: number) {
  const staff = await requireRole("enfants");
  await db.delete(classes).where(eq(classes.id, id));
  await logAction(staff, "suppression", "classe", id);
  revalidatePath(PATH);
}

export async function addTeacher(classId: number, formData: FormData) {
  const staff = await requireRole("enfants");
  const name = text(formData, "name");
  if (!name) return;
  await db.insert(teachers).values({ classId, name, phone: text(formData, "phone") || null });
  await logAction(staff, "ajout", "moniteur");
  revalidatePath(PATH);
}

export async function deleteTeacher(id: number) {
  const staff = await requireRole("enfants");
  await db.delete(teachers).where(eq(teachers.id, id));
  await logAction(staff, "suppression", "moniteur", id);
  revalidatePath(PATH);
}

export async function addSession(classId: number, formData: FormData) {
  const staff = await requireRole("enfants");
  const date = parseLocalDateTime(text(formData, "date"));
  if (!date) return;
  const childrenCount = Math.max(0, Number(text(formData, "childrenCount")) || 0);
  await db.insert(classSessions).values({ classId, date, lesson: text(formData, "lesson") || null, childrenCount, notes: text(formData, "notes") || null });
  await logAction(staff, "ajout", "séance");
  revalidatePath(PATH);
}

export async function deleteSession(id: number) {
  const staff = await requireRole("enfants");
  await db.delete(classSessions).where(eq(classSessions.id, id));
  await logAction(staff, "suppression", "séance", id);
  revalidatePath(PATH);
}
