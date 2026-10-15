import "server-only";
import { eglise } from "@/config/eglise";

/**
 * Lecture de la chaîne YouTube de l'église :
 * 1. API YouTube Data v3 si `YOUTUBE_API_KEY` est défini (le plus fiable) ;
 * 2. sinon flux RSS de la chaîne (dates exactes) ;
 * 3. sinon la page des directs de la chaîne (dates exactes lues sur chaque vidéo).
 * La détection du direct passe par l'adresse « /live » de la chaîne (gratuit),
 * puis par l'API en secours.
 */

export type ChannelVideo = { videoId: string; title: string; date: Date; generic: boolean };

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
/** Titres automatiques des directs (« philadelphie French-haitian church SDA 2026 ») : on affiche « Culte du <date> » à la place. */
const GENERIC_TITLE = /^philadelphie\s+french[- ]?haitian/i;

async function fetchText(url: string, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.8" }, signal: ctrl.signal, cache: "no-store" });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const API = "https://www.googleapis.com/youtube/v3";
type ApiPlaylistItems = { items?: { contentDetails?: { videoId?: string; videoPublishedAt?: string } }[] };
type ApiVideos = { items?: { id: string; snippet?: { title?: string; publishedAt?: string; liveBroadcastContent?: string }; liveStreamingDetails?: { actualStartTime?: string; scheduledStartTime?: string } }[] };

/**
 * API YouTube Data v3 : liste des envois de la chaîne (playlist « UU… ») puis détails
 * des vidéos (début réel du direct). Deux requêtes, 2 unités de quota.
 */
async function fromApi(key: string, channelId: string, limit: number): Promise<ChannelVideo[] | null> {
  const uploads = `UU${channelId.slice(2)}`;
  const list = await fetchJson<ApiPlaylistItems>(`${API}/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=${Math.min(limit + 3, 50)}&key=${key}`);
  const ids = (list?.items ?? []).map((i) => i.contentDetails?.videoId).filter((x): x is string => !!x);
  if (ids.length === 0) return list ? [] : null;
  const details = await fetchJson<ApiVideos>(`${API}/videos?part=snippet,liveStreamingDetails&id=${ids.join(",")}&key=${key}`);
  if (!details) return null;
  return (details.items ?? [])
    // Les directs programmés mais pas encore commencés n'apparaissent pas
    .filter((v) => v.snippet?.liveBroadcastContent !== "upcoming")
    .map((v) => {
      const title = v.snippet?.title ?? "";
      const iso = v.liveStreamingDetails?.actualStartTime ?? v.snippet?.publishedAt ?? "";
      return { videoId: v.id, title, date: new Date(iso), generic: GENERIC_TITLE.test(title) };
    })
    .filter((v) => !Number.isNaN(v.date.getTime()));
}

/** Direct en cours via l'API (recherche eventType=live : 100 unités, utilisé seulement en secours). */
async function liveFromApi(key: string, channelId: string) {
  const res = await fetchJson<{ items?: { id?: { videoId?: string } }[] }>(`${API}/search?part=id&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${key}`);
  const videoId = res?.items?.[0]?.id?.videoId ?? null;
  return res ? { live: !!videoId, videoId } : null;
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Flux RSS : <entry> avec yt:videoId, title, published. */
function fromFeed(xml: string): ChannelVideo[] {
  const out: ChannelVideo[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const id = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = decode(entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !published) continue;
    out.push({ videoId: id, title, date: new Date(published), generic: GENERIC_TITLE.test(title) });
  }
  return out;
}

/** Page d'onglet de la chaîne : vidéos dans ytInitialData → richItemRenderer → lockupViewModel. */
function fromPage(html: string): { videoId: string; title: string; relative: string }[] {
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (!m) return [];
  const out: { videoId: string; title: string; relative: string }[] = [];
  const seen = new Set<string>();
  const walk = (o: unknown) => {
    if (Array.isArray(o)) {
      for (const x of o) walk(x);
      return;
    }
    if (!o || typeof o !== "object") return;
    const rec = o as Record<string, unknown>;
    const lockup = rec.lockupViewModel as Record<string, unknown> | undefined;
    if (lockup && lockup.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" && typeof lockup.contentId === "string" && !seen.has(lockup.contentId)) {
      seen.add(lockup.contentId);
      const json = JSON.stringify(lockup);
      const title = (json.match(/"title":\{"content":"((?:[^"\\]|\\.)*)"/)?.[1] ?? "").replace(/\\"/g, '"').replace(/\\n/g, " ");
      const relative = json.match(/"content":"((?:Streamed |Premiered )?\d+\s?(?:mo|[smhdwy])\w* ago)"/)?.[1] ?? "";
      out.push({ videoId: lockup.contentId, title, relative });
    }
    for (const v of Object.values(rec)) walk(v);
  };
  try {
    walk(JSON.parse(m[1]));
  } catch {
    return [];
  }
  return out;
}

/** Date approximative à partir de « Streamed 2w ago », ramenée au samedi précédent (les cultes ont lieu le Sabbat). */
function approxDate(relative: string) {
  const m = relative.match(/(\d+)\s?(mo|[smhdwy])/);
  const d = new Date();
  if (m) {
    const n = Number(m[1]);
    const unit = m[2];
    const days = unit === "y" ? n * 365 : unit === "mo" ? n * 30 : unit === "w" ? n * 7 : unit === "d" ? n : 0;
    d.setUTCDate(d.getUTCDate() - days);
  }
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7));
  d.setUTCHours(16, 0, 0, 0);
  return d;
}

/** Date exacte d'une vidéo (début du direct, sinon date de publication). */
async function exactDate(videoId: string) {
  const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
  const iso = html?.match(/"startTimestamp":"([^"]+)"/)?.[1] ?? html?.match(/"publishDate":"([^"]+)"/)?.[1];
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** Dernières vidéos de la chaîne (directs passés et vidéos), les plus récentes d'abord. */
export async function fetchChannelVideos(limit = 12): Promise<ChannelVideo[]> {
  const id = eglise.youtubeChannelId;
  if (!id) return [];
  const key = process.env.YOUTUBE_API_KEY;
  let list = key ? ((await fromApi(key, id, limit)) ?? []) : [];
  if (list.length === 0) {
    const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    list = xml ? fromFeed(xml) : [];
  }
  if (list.length === 0) {
    const pages = await Promise.all([fetchText(`https://www.youtube.com/channel/${id}/streams`), fetchText(`https://www.youtube.com/channel/${id}/videos`)]);
    const raw = pages.flatMap((html) => (html ? fromPage(html) : [])).slice(0, limit);
    list = await Promise.all(
      raw.map(async (v) => ({ videoId: v.videoId, title: v.title, generic: GENERIC_TITLE.test(v.title), date: (await exactDate(v.videoId)) ?? approxDate(v.relative) })),
    );
  }
  const seen = new Set<string>();
  return list
    .filter((v) => (seen.has(v.videoId) ? false : (seen.add(v.videoId), true)))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

/** Direct en cours sur la chaîne ? (page « /live » de la chaîne) */
export async function fetchLiveNow(): Promise<{ live: boolean; videoId: string | null }> {
  const id = eglise.youtubeChannelId;
  if (!id) return { live: false, videoId: null };
  const html = await fetchText(`https://www.youtube.com/channel/${id}/live`, 6000);
  if (!html) {
    const key = process.env.YOUTUBE_API_KEY;
    return (key && (await liveFromApi(key, id))) || { live: false, videoId: null };
  }
  const live = html.includes('"isLiveNow":true');
  const videoId = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1] ?? null;
  return { live, videoId: live ? videoId : null };
}
