import Image from "next/image";
import Link from "next/link";
import type { posts } from "@/db/schema";
import type { Locale } from "@/i18n/locales";
import { shortDate } from "@/lib/format";
import { fileUrl } from "@/lib/public-data";
import { Reveal } from "./reveal";

export type Post = typeof posts.$inferSelect;

/** Titre et texte dans la langue demandée (repli sur le français). */
export function postText(post: Post, lang: Locale) {
  const title = lang === "en" && post.titleEn ? post.titleEn : post.title;
  const body = lang === "en" && post.bodyEn ? post.bodyEn : post.body;
  return { title, body, date: post.publishedAt ?? post.createdAt };
}

export function excerpt(text: string, max = 150) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Carte d'une publication « Vie de l'église » : photo, département, titre, extrait, date. */
export function PostCard({ post, lang, dept, delay = 0 }: { post: Post; lang: Locale; dept: string; delay?: number }) {
  const { title, body, date } = postText(post, lang);
  return (
    <Reveal delay={delay}>
      <Link href={`/${lang}/vie/${post.id}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-night shadow-lg">
          {post.photoPathname ? (
            <Image src={fileUrl(post.photoPathname)} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw" className="object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="bg-grain absolute inset-0 grid place-items-center bg-night-2">
              <span className="font-display-italic text-8xl leading-none text-gold">{title.trim().charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
          <span className="absolute top-4 left-4 rounded-full bg-surface/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-night backdrop-blur">{dept}</span>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{shortDate(date, lang)}</p>
        <h3 className="mt-1 font-display text-2xl leading-tight font-semibold text-night transition group-hover:text-accent">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{excerpt(body)}</p>
      </Link>
    </Reveal>
  );
}
