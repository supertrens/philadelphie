"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, rota, services, setlist, songs } from "@/db";
import { requireRole } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";

const PATH = "/espace/louange";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function addService(formData: FormData) {
  await requireRole("louange");
  const date = parseLocalDateTime(text(formData, "date"));
  if (!date) return;
  await db.insert(services).values({ date, theme: text(formData, "theme") || null });
  revalidatePath(PATH);
}

export async function deleteService(id: number) {
  await requireRole("louange");
  await db.delete(services).where(eq(services.id, id));
  revalidatePath(PATH);
}

export async function addRota(serviceId: number, formData: FormData) {
  await requireRole("louange");
  const role = text(formData, "role");
  const person = text(formData, "person");
  if (!role || !person) return;
  await db.insert(rota).values({ serviceId, role, person });
  revalidatePath(PATH);
}

export async function removeRota(id: number) {
  await requireRole("louange");
  await db.delete(rota).where(eq(rota.id, id));
  revalidatePath(PATH);
}

export async function addToSetlist(serviceId: number, formData: FormData) {
  await requireRole("louange");
  const songId = Number(formData.get("songId"));
  if (!Number.isInteger(songId) || songId <= 0) return;
  const [{ last }] = await db.select({ last: max(setlist.position) }).from(setlist).where(eq(setlist.serviceId, serviceId));
  await db.insert(setlist).values({ serviceId, songId, position: (last ?? 0) + 1 });
  revalidatePath(PATH);
}

export async function removeFromSetlist(id: number) {
  await requireRole("louange");
  await db.delete(setlist).where(eq(setlist.id, id));
  revalidatePath(PATH);
}

export async function addSong(formData: FormData) {
  await requireRole("louange");
  const title = text(formData, "title");
  if (!title) return;
  const link = text(formData, "link");
  await db.insert(songs).values({
    title,
    artist: text(formData, "artist") || null,
    musicalKey: text(formData, "musicalKey") || null,
    link: /^https?:\/\//.test(link) ? link : null,
  });
  revalidatePath(PATH);
}

export async function deleteSong(id: number) {
  await requireRole("louange");
  await db.delete(songs).where(eq(songs.id, id));
  revalidatePath(PATH);
}
