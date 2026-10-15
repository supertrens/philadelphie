import Link from "next/link";
import type { Locale } from "@/i18n/locales";

/** Pastille rouge « En direct » (seule couleur hors palette, volontairement). */
export function LiveBadge({ lang, label, size = "sm", className = "" }: { lang: Locale; label: string; size?: "sm" | "lg"; className?: string }) {
  const dims = size === "lg" ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-[11px]";
  return (
    <Link href={`/${lang}/en-direct`} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-red-600 font-semibold uppercase tracking-[0.14em] text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 ${dims} ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      {label}
    </Link>
  );
}
