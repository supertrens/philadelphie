"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { announcements, contactMessages, db, members, sabbathVisitors } from "@/db";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { sabbathDate } from "@/lib/sabbath";

const PATH = "/espace/secretariat";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optional = (f: FormData, k: string) => text(f, k) || null;

function memberFields(f: FormData) {
  return {
    firstName: text(f, "firstName"),
    lastName: text(f, "lastName"),
    phone: optional(f, "phone"),
    email: optional(f, "email"),
    department: optional(f, "department"),
    notes: optional(f, "notes"),
  };
}

export async function addMember(formData: FormData) {
  const staff = await requireRole("secretariat");
  const fields = memberFields(formData);
  if (!fields.firstName || !fields.lastName) return;
  await db.insert(members).values(fields);
  await logAction(staff, "addMember", "secretariat");
  revalidatePath(PATH);
}

export async function updateMember(id: number, formData: FormData) {
  const staff = await requireRole("secretariat");
  const fields = memberFields(formData);
  if (!fields.firstName || !fields.lastName) return;
  await db.update(members).set(fields).where(eq(members.id, id));
  await logAction(staff, "updateMember", "secretariat");
  revalidatePath(PATH);
}

export async function deleteMember(id: number) {
  const staff = await requireRole("secretariat");
  await db.delete(members).where(eq(members.id, id));
  await logAction(staff, "deleteMember", "secretariat");
  revalidatePath(PATH);
}

export async function addAnnouncement(formData: FormData) {
  const staff = await requireRole("secretariat");
  const title = text(formData, "title");
  const body = text(formData, "body");
  if (!title || !body) return;
  await db.insert(announcements).values({ title, body, published: formData.get("published") === "on" });
  updateTag("public");
  await logAction(staff, "addAnnouncement", "secretariat");
  revalidatePath(PATH);
}

export async function toggleAnnouncement(id: number, published: boolean) {
  const staff = await requireRole("secretariat");
  await db.update(announcements).set({ published }).where(eq(announcements.id, id));
  updateTag("public");
  await logAction(staff, "toggleAnnouncement", "secretariat");
  revalidatePath(PATH);
}

export async function deleteAnnouncement(id: number) {
  const staff = await requireRole("secretariat");
  await db.delete(announcements).where(eq(announcements.id, id));
  updateTag("public");
  await logAction(staff, "deleteAnnouncement", "secretariat");
  revalidatePath(PATH);
}

export async function setContactStatus(id: number, status: "nouveau" | "traite") {
  const staff = await requireRole("secretariat");
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  await logAction(staff, status === "traite" ? "message traité" : "message rouvert", "contact", id);
  revalidatePath(PATH);
}

export async function deleteContactMessage(id: number) {
  const staff = await requireRole("secretariat");
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  await logAction(staff, "suppression", "contact", id);
  revalidatePath(PATH);
}

// ---------- Visiteurs du Sabbat (affichés sur l'écran de bienvenue) ----------
export async function addVisitor(formData: FormData) {
  const staff = await requireRole("secretariat");
  const name = text(formData, "name");
  if (!name) return;
  await db.insert(sabbathVisitors).values({ date: sabbathDate(), name, origin: optional(formData, "origin"), createdBy: staff.name });
  await logAction(staff, "ajout", "visiteur");
  revalidatePath(PATH);
  revalidatePath("/espace/comptage");
}

export async function deleteVisitor(id: number) {
  const staff = await requireRole("secretariat");
  await db.delete(sabbathVisitors).where(eq(sabbathVisitors.id, id));
  await logAction(staff, "suppression", "visiteur", id);
  revalidatePath(PATH);
  revalidatePath("/espace/comptage");
}
