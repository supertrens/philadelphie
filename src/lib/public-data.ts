import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { announcements, bulletins, db, events, posts, sermons, settings } from "@/db";

/**
 * Données du site public, mises en cache et invalidées par `updateTag("public")`
 * depuis l'espace membres.
 */

export async function getLiveStatus() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  const rows = await db.select().from(settings);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const url = (s.live_url ?? "").trim();
  return { live: s.live_now === "1", url: url || null, youtubeId: youtubeIdFromUrl(url) };
}

export async function getHomeContent() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  const [news, upcoming, vie] = await Promise.all([
    db.select().from(announcements).where(eq(announcements.published, true)).orderBy(desc(announcements.createdAt)).limit(3),
    db.select().from(events).where(and(eq(events.isPublic, true), gte(events.startsAt, new Date()))).orderBy(asc(events.startsAt)).limit(5),
    db.select().from(posts).where(eq(posts.published, true)).orderBy(postOrder).limit(6),
  ]);
  return { news, upcoming, vie };
}

/** Publications « Vie de l'église » : les plus récentes d'abord (date de publication, sinon de création). */
const postOrder = desc(sql`coalesce(${posts.publishedAt}, ${posts.createdAt})`);

/** Agenda de la page « Vie de l'église » : annonces, prochains rendez-vous et bulletins. */
export async function getAgenda() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  const [news, upcoming, bulletinList] = await Promise.all([
    db.select().from(announcements).where(eq(announcements.published, true)).orderBy(desc(announcements.createdAt)).limit(10),
    db.select().from(events).where(and(eq(events.isPublic, true), gte(events.startsAt, new Date()))).orderBy(asc(events.startsAt)).limit(12),
    db.select().from(bulletins).orderBy(desc(bulletins.weekOf)).limit(6),
  ]);
  return { news, upcoming, bulletins: bulletinList };
}

export async function getPosts() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  return db.select().from(posts).where(eq(posts.published, true)).orderBy(postOrder).limit(120);
}

export async function getPost(id: number) {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.published, true))).limit(1);
  return row ?? null;
}

export async function getSermons() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  return db.select().from(sermons).where(eq(sermons.published, true)).orderBy(desc(sermons.date)).limit(200);
}

export async function getSermon(id: number) {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db.select().from(sermons).where(and(eq(sermons.id, id), eq(sermons.published, true))).limit(1);
  return row ?? null;
}

export async function getBulletins() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  return db.select().from(bulletins).orderBy(desc(bulletins.weekOf)).limit(60);
}

/** Extrait l'identifiant d'une URL YouTube (watch, youtu.be, live, embed). */
export function youtubeIdFromUrl(input: string) {
  const m = input.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/) ?? input.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}

/** Lien de téléchargement d'un fichier public du stockage. */
export const fileUrl = (pathname: string) => `/api/fichier?p=${encodeURIComponent(pathname)}`;
