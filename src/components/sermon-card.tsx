import { Headphones, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { sermons } from "@/db/schema";
import type { Locale } from "@/i18n/locales";
import { shortDate } from "@/lib/format";
import { Reveal } from "./reveal";

type Sermon = typeof sermons.$inferSelect;

/** Carte d'un message : vignette YouTube (ou motif audio), titre, prédicateur, date. */
export function SermonCard({ sermon: s, lang, delay = 0, audioLabel }: { sermon: Sermon; lang: Locale; delay?: number; audioLabel: string }) {
  return (
    <Reveal delay={delay}>
      <Link href={`/${lang}/messages/${s.id}`} className="group block">
        <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-night shadow-lg">
          {s.youtubeId ? (
            <Image src={`https://i.ytimg.com/vi/${s.youtubeId}/hqdefault.jpg`} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw" className="object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="bg-grain absolute inset-0 grid place-items-center bg-night-2 text-gold">
              <Headphones className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
          <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-night shadow-xl"><PlayCircle className="h-7 w-7" /></span>
          </span>
          {s.series && <span className="absolute top-4 left-4 rounded-full bg-surface/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-night backdrop-blur">{s.series}</span>}
          {!s.youtubeId && s.audioPathname && <span className="absolute right-4 bottom-4 rounded-full bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-night">{audioLabel}</span>}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{shortDate(s.date, lang)}{s.speaker ? ` · ${s.speaker}` : ""}</p>
        <h3 className="mt-1 font-display text-2xl leading-tight font-semibold text-night transition group-hover:text-accent">{s.title}</h3>
        {s.scripture && <p className="mt-1 font-display-italic text-lg text-gold">{s.scripture}</p>}
      </Link>
    </Reveal>
  );
}
