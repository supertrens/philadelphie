import { count, eq, gte, and } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BirthdaysCard } from "@/components/birthdays-card";
import { Card, Empty, PageHeader, Stat, formatDate } from "@/components/ui";
import { auditLog, contactMessages, db, events, members, prayerRequests, services } from "@/db";
import { can, requireStaff } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/departments";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de l'église et de vos départements." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const staff = await requireStaff();
  const mine = DEPARTMENTS.filter((d) => can(staff, d.slug));
  const now = new Date();
  const [[{ membres }], [{ prieres }], [{ contacts }], [{ evenements }], [prochainCulte], journal] = await Promise.all([
    db.select({ membres: count() }).from(members),
    db.select({ prieres: count() }).from(prayerRequests).where(eq(prayerRequests.status, "nouveau")),
    db.select({ contacts: count() }).from(contactMessages).where(eq(contactMessages.status, "nouveau")),
    db.select({ evenements: count() }).from(events).where(and(eq(events.isPublic, true), gte(events.startsAt, now))),
    db.select().from(services).where(gte(services.date, now)).orderBy(services.date).limit(1),
    db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(8),
  ]);

  if (mine.length === 0) {
    return (
      <Card title="Bienvenue">
        <Empty>Votre compte n’a pas encore accès à un département. Demandez à un administrateur de vous attribuer un rôle.</Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Membres" value={membres} />
        <Stat label="Prières à traiter" value={prieres} />
        <Stat label="Messages reçus" value={contacts} />
        <Stat label="Prochain culte" value={prochainCulte ? formatDate(prochainCulte.date) : "—"} />
      </div>

      <Card title="Vos départements">
        <ul className="grid gap-3 sm:grid-cols-2">
          {mine.map((d) => (
            <li key={d.slug}>
              <Link href={`/espace/${d.slug}`} className="group flex items-center justify-between rounded-2xl border border-line p-4 transition hover:border-accent/40 hover:bg-subtle">
                <span>
                  <span className="block font-display text-lg font-semibold">{d.name}</span>
                  <span className="block text-sm text-muted">{d.description}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent transition group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">{evenements} événement{evenements > 1 ? "s" : ""} public{evenements > 1 ? "s" : ""} à venir sur le site.</p>
      </Card>

      <BirthdaysCard />

      {can(staff, "admin") && (
        <Card title="Dernières actions">
          {journal.length === 0 ? <Empty>Aucune action enregistrée.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {journal.map((j) => (
                <li key={j.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span><span className="font-medium">{j.userName}</span> <span className="text-muted">{j.action} · {j.entity}{j.entityId ? ` #${j.entityId}` : ""}</span></span>
                  <span className="text-xs text-muted">{formatDate(j.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
