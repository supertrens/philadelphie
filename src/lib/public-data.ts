import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { announcements, bulletins, db, events, posts, sermons, settings } from "@/db";
import { fetchChannelVideos, fetchLiveNow } from "./youtube";

/**
 * Données du site public, mises en cache et invalidées par `updateTag("public")`
 * depuis l'espace membres.
 */

/** Direct : interrupteur manuel du Média (settings) OU direct détecté sur la chaîne YouTube. */
export async function getLiveStatus() {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  const [rows, yt] = await Promise.all([db.select().from(settings), fetchLiveNow().catch(() => ({ live: false, videoId: null }))]);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const url = (s.live_url ?? "").trim();
  const manual = s.live_now === "1";
  const youtubeId = youtubeIdFromUrl(url) ?? yt.videoId;
  return { live: manual || yt.live, url: url || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null), youtubeId };
}

/** Un message public : enregistré par le Média (id numérique) ou lu sur la chaîne YouTube (id = identifiant vidéo). */
export type PublicSermon = Omit<typeof sermons.$inferSelect, "id" | "published"> & { id: number | string };

/** Dernières vidéos de la chaîne YouTube (rafraîchies toutes les heures). */
export async function getChannelVideos() {
  "use cache";
  cacheTag("public");
  cacheLife("hours");
  return fetchChannelVideos(12).catch(() => []);
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

/** Messages : ceux du Média, complétés par les vidéos de la chaîne YouTube non encore enregistrées. */
export async function getSermons(): Promise<PublicSermon[]> {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  const [rows, videos] = await Promise.all([
    db.select().from(sermons).where(eq(sermons.published, true)).orderBy(desc(sermons.date)).limit(200),
    getChannelVideos(),
  ]);
  const known = new Set(rows.map((r) => r.youtubeId).filter(Boolean));
  const extra: PublicSermon[] = videos
    .filter((v) => !known.has(v.videoId))
    .map((v) => ({ id: v.videoId, title: v.generic ? "" : v.title, speaker: null, date: v.date, youtubeId: v.videoId, audioPathname: null, series: null, scripture: null }));
  return [...rows, ...extra].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getSermon(id: string): Promise<PublicSermon | null> {
  "use cache";
  cacheTag("public");
  cacheLife("minutes");
  if (/^\d+$/.test(id)) {
    const [row] = await db.select().from(sermons).where(and(eq(sermons.id, Number(id)), eq(sermons.published, true))).limit(1);
    return row ?? null;
  }
  if (!/^[\w-]{11}$/.test(id)) return null;
  return (await getSermons()).find((s) => s.id === id) ?? null;
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
