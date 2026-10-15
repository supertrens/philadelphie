"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { attendance, db, events, members } from "@/db";
import { requireRole } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";

const PATH = "/espace/jeunesse";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function addEvent(formData: FormData) {
  await requireRole("jeunesse");
  const title = text(formData, "title");
  const startsAt = parseLocalDateTime(text(formData, "startsAt"));
  if (!title || !startsAt) return;
  await db.insert(events).values({
    title,
    startsAt,
    location: text(formData, "location") || null,
    description: text(formData, "description") || null,
    department: "jeunesse",
    isPublic: formData.get("isPublic") === "on",
  });
  updateTag("public");
  revalidatePath(PATH);
}

export async function deleteEvent(id: number) {
  await requireRole("jeunesse");
  await db.delete(events).where(eq(events.id, id));
  updateTag("public");
  revalidatePath(PATH);
}

export async function addYouth(formData: FormData) {
  await requireRole("jeunesse");
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  if (!firstName || !lastName) return;
  await db.insert(members).values({ firstName, lastName, phone: text(formData, "phone") || null, department: "jeunesse" });
  revalidatePath(PATH);
}

export async function saveAttendance(eventId: number, formData: FormData) {
  await requireRole("jeunesse");
  const present = formData.getAll("present").map(Number).filter(Number.isInteger);
  await db.delete(attendance).where(eq(attendance.eventId, eventId));
  if (present.length) {
    await db.insert(attendance).values(present.map((memberId) => ({ eventId, memberId })));
  }
  revalidatePath(PATH);
}
