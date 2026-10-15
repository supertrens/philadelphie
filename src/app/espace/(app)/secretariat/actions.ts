"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { announcements, db, members } from "@/db";
import { requireRole } from "@/lib/auth";

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
  await requireRole("secretariat");
  const fields = memberFields(formData);
  if (!fields.firstName || !fields.lastName) return;
  await db.insert(members).values(fields);
  revalidatePath(PATH);
}

export async function updateMember(id: number, formData: FormData) {
  await requireRole("secretariat");
  const fields = memberFields(formData);
  if (!fields.firstName || !fields.lastName) return;
  await db.update(members).set(fields).where(eq(members.id, id));
  revalidatePath(PATH);
}

export async function deleteMember(id: number) {
  await requireRole("secretariat");
  await db.delete(members).where(eq(members.id, id));
  revalidatePath(PATH);
}

export async function addAnnouncement(formData: FormData) {
  await requireRole("secretariat");
  const title = text(formData, "title");
  const body = text(formData, "body");
  if (!title || !body) return;
  await db.insert(announcements).values({ title, body, published: formData.get("published") === "on" });
  updateTag("public");
  revalidatePath(PATH);
}

export async function toggleAnnouncement(id: number, published: boolean) {
  await requireRole("secretariat");
  await db.update(announcements).set({ published }).where(eq(announcements.id, id));
  updateTag("public");
  revalidatePath(PATH);
}

export async function deleteAnnouncement(id: number) {
  await requireRole("secretariat");
  await db.delete(announcements).where(eq(announcements.id, id));
  updateTag("public");
  revalidatePath(PATH);
}
