import { UserButton } from "@clerk/nextjs";
import {
  Baby, Coins, ExternalLink, FileText, Hash, HeartHandshake, LayoutDashboard, Music, Sparkles, Tv, Users,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { eglise } from "@/config/eglise";
import { can, getStaff } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/departments";

const ICONS = {
  secretariat: FileText, pastorat: HeartHandshake, jeunesse: Sparkles, enfants: Baby, louange: Music, tresorerie: Coins, media: Tv,
} as const;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0 md:border-line">
        <div className="flex items-center justify-between gap-3 p-4 md:p-5">
          <Link href="/espace" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="leading-tight">
              <span className="block font-display-italic text-xl text-night">{eglise.nomCourt}</span>
              <span className="block text-[11px] text-muted">Espace membres</span>
            </span>
          </Link>
          <div className="md:hidden"><UserButton /></div>
        </div>
        <Suspense fallback={<div className="h-10" />}>
          <Nav />
        </Suspense>
        <div className="mt-auto hidden border-t border-line p-4 md:block">
          <Link href="/fr" className="flex items-center gap-2 text-xs text-muted hover:text-accent">
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
  const staff = await getStaff();
  const visible = DEPARTMENTS.filter((d) => can(staff, d.slug));
  return (
    <nav className="flex flex-col gap-3 px-3 pb-3 md:flex-1 md:overflow-y-auto md:pb-4">
      <div className="flex gap-1 overflow-x-auto md:flex-col">
        <NavLink href="/espace" icon={LayoutDashboard} label="Tableau de bord" />
        <NavLink href="/espace/comptage" icon={Hash} label="Comptage du Sabbat" />
        {visible.map((d) => <NavLink key={d.slug} href={`/espace/${d.slug}`} icon={ICONS[d.slug]} label={d.name} />)}
        {can(staff, "admin") && <NavLink href="/espace/admin" icon={Users} label="Utilisateurs & accès" />}
      </div>
      {staff && (
        <div className="hidden items-center gap-3 rounded-xl bg-subtle px-3 py-2.5 md:flex">
          <UserButton />
          <span className="min-w-0 text-xs">
            <span className="block truncate font-semibold text-ink">{staff.name}</span>
            <span className="block truncate text-muted">{staff.roles.includes("admin") ? "Administration" : visible.map((d) => d.name).join(", ") || "Aucun accès"}</span>
          </span>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-subtle">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-night text-gold"><Icon className="h-4 w-4" /></span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
