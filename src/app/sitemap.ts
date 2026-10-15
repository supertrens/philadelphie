import type { MetadataRoute } from "next";
import { eglise } from "@/config/eglise";
import { LOCALES } from "@/i18n/locales";
import { getPosts, getSermons } from "@/lib/public-data";

const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/messages", priority: 0.8, changeFrequency: "weekly" },
  { path: "/vie", priority: 0.8, changeFrequency: "weekly" },
  { path: "/en-direct", priority: 0.8, changeFrequency: "weekly" },
  { path: "/priere", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = eglise.siteUrl;
  const languages = (path: string) => Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`]));
  const [sermons, posts] = await Promise.all([getSermons().catch(() => []), getPosts().catch(() => [])]);
  return [
    ...PAGES.flatMap((p) => LOCALES.map((lang) => ({ url: `${base}/${lang}${p.path}`, priority: p.priority, changeFrequency: p.changeFrequency, alternates: { languages: languages(p.path) } }))),
    ...sermons.flatMap((s) => LOCALES.map((lang) => ({ url: `${base}/${lang}/messages/${s.id}`, lastModified: s.date, priority: 0.5, changeFrequency: "monthly" as const, alternates: { languages: languages(`/messages/${s.id}`) } }))),
    ...posts.flatMap((p) => LOCALES.map((lang) => ({ url: `${base}/${lang}/vie/${p.id}`, lastModified: p.publishedAt ?? p.createdAt, priority: 0.5, changeFrequency: "monthly" as const, alternates: { languages: languages(`/vie/${p.id}`) } }))),
  ];
}
