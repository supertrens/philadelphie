"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { bulletins, db, mediaPosts, sermons, settings } from "@/db";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";

const PATH = "/espace/media";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Accepte un identifiant YouTube ou une URL (watch, youtu.be, live). */
function youtubeId(input: string) {
  const m = input.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([\w-]{11})/) ?? input.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}

export async function addSermon(formData: FormData) {
  const staff = await requireRole("media");
  const title = text(formData, "title");
  const date = parseLocalDateTime(text(formData, "date"));
  if (!title || !date) return;
  await db.insert(sermons).values({
    title, date,
    speaker: text(formData, "speaker") || null,
    youtubeId: youtubeId(text(formData, "youtube")),
    audioPathname: text(formData, "audio") || null,
    series: text(formData, "series") || null,
    scripture: text(formData, "scripture") || null,
    published: formData.get("published") === "on",
  });
  await logAction(staff, "ajout", "message");
  updateTag("public");
  revalidatePath(PATH);
}

export async function toggleSermon(id: number, published: boolean) {
  const staff = await requireRole("media");
  await db.update(sermons).set({ published }).where(eq(sermons.id, id));
  await logAction(staff, published ? "publication" : "dépublication", "message", id);
  updateTag("public");
  revalidatePath(PATH);
}

export async function deleteSermon(id: number) {
  const staff = await requireRole("media");
  await db.delete(sermons).where(eq(sermons.id, id));
  await logAction(staff, "suppression", "message", id);
  updateTag("public");
  revalidatePath(PATH);
}

export async function addBulletin(formData: FormData) {
  const staff = await requireRole("media");
  const weekOf = parseLocalDateTime(text(formData, "weekOf"));
  const pathname = text(formData, "file");
  if (!weekOf || !pathname) return;
  await db.insert(bulletins).values({ weekOf, pathname, notes: text(formData, "notes") || null });
  await logAction(staff, "ajout", "bulletin");
  updateTag("public");
  revalidatePath(PATH);
}

export async function deleteBulletin(id: number) {
  const staff = await requireRole("media");
  await db.delete(bulletins).where(eq(bulletins.id, id));
  await logAction(staff, "suppression", "bulletin", id);
  updateTag("public");
  revalidatePath(PATH);
}

export async function saveLiveSettings(formData: FormData) {
  const staff = await requireRole("media");
  const liveNow = formData.get("liveNow") === "on" ? "1" : "0";
  const liveUrl = text(formData, "liveUrl");
  for (const [key, value] of [["live_now", liveNow], ["live_url", liveUrl]] as const) {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  await logAction(staff, "réglages direct", "parametres");
  updateTag("public");
  revalidatePath(PATH);
}

export async function addPost(formData: FormData) {
  const staff = await requireRole("media");
  const title = text(formData, "title");
  const kind = text(formData, "kind");
  if (!title || !kind) return;
  await db.insert(mediaPosts).values({
    title, kind,
    pathname: text(formData, "file") || null,
    link: text(formData, "link") || null,
    publishAt: parseLocalDateTime(text(formData, "publishAt")),
  });
  await logAction(staff, "ajout", "publication");
  revalidatePath(PATH);
}

export async function setPostStatus(id: number, status: "idee" | "pret" | "publie") {
  const staff = await requireRole("media");
  await db.update(mediaPosts).set({ status }).where(eq(mediaPosts.id, id));
  await logAction(staff, `statut : ${status}`, "publication", id);
  revalidatePath(PATH);
}

export async function deletePost(id: number) {
  const staff = await requireRole("media");
  await db.delete(mediaPosts).where(eq(mediaPosts.id, id));
  await logAction(staff, "suppression", "publication", id);
  revalidatePath(PATH);
}
