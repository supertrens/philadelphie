import { ExternalLink, FileText, LogOut, Music, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { eglise } from "@/config/eglise";
import { getRole } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/departments";
import { logout } from "../actions";

const ICONS = { secretariat: FileText, jeunesse: Sparkles, louange: Music } as const;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0 md:border-line">
        <div className="flex items-center justify-between gap-3 p-4 md:p-5">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold">{eglise.nomCourt}</span>
              <span className="block text-[11px] text-muted">Espace membres</span>
            </span>
          </Link>
          <form action={logout} className="md:hidden">
            <button className="rounded-lg p-2 text-muted hover:bg-subtle" aria-label="Déconnexion"><LogOut className="h-5 w-5" /></button>
          </form>
        </div>
        <Suspense fallback={<div className="h-10" />}>
          <Nav />
        </Suspense>
        <div className="mt-auto hidden border-t border-line p-4 md:block">
          <Link href="/" className="flex items-center gap-2 text-xs text-muted hover:text-accent">
            <ExternalLink className="h-3.5 w-3.5" /> Voir le site public
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

async function Nav() {
  const role = await getRole();
  const visible = DEPARTMENTS.filter((d) => role === "admin" || role === d.slug);
  return (
    <nav className="flex flex-col gap-3 px-3 pb-3 md:flex-1 md:pb-4">
      <div className="flex gap-1 overflow-x-auto md:flex-col">
        {visible.map((d) => {
          const Icon = ICONS[d.slug];
          return (
            <Link key={d.slug} href={`/espace/${d.slug}`} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-subtle">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-night text-gold"><Icon className="h-4 w-4" /></span>
              {d.name}
            </Link>
          );
        })}
      </div>
      <div className="hidden items-center justify-between rounded-xl bg-subtle px-3 py-2.5 md:flex">
        <span className="text-xs">
          <span className="block text-muted">Connecté en tant que</span>
          <span className="font-semibold capitalize text-accent">{role === "admin" ? "Administration" : DEPARTMENTS.find((d) => d.slug === role)?.name}</span>
        </span>
        <form action={logout}>
          <button className="rounded-lg p-1.5 text-muted hover:bg-line hover:text-ink" aria-label="Déconnexion"><LogOut className="h-4 w-4" /></button>
        </form>
      </div>
    </nav>
  );
}
