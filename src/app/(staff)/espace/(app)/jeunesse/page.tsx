import { asc, desc, eq, gte, lt, and } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { attendance, db, events, members } from "@/db";
import { Button, Card, Empty, Field, Input, PageHeader, Stat, Textarea, formatDateTime } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { addEvent, addYouth, deleteEvent, saveAttendance } from "./actions";

export const metadata: Metadata = { title: "Jeunesse" };

export default function JeunessePage() {
  return (
    <>
      <PageHeader title="Jeunesse" subtitle="Activités, jeunes inscrits et présences." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

type Event = typeof events.$inferSelect;
type Member = typeof members.$inferSelect;

async function Content() {
  await requireRole("jeunesse");
  const now = new Date();
  const isYouth = eq(events.department, "jeunesse");
  const [upcoming, past, youth, presence] = await Promise.all([
    db.select().from(events).where(and(isYouth, gte(events.startsAt, now))).orderBy(asc(events.startsAt)),
    db.select().from(events).where(and(isYouth, lt(events.startsAt, now))).orderBy(desc(events.startsAt)).limit(10),
    db.select().from(members).where(eq(members.department, "jeunesse")).orderBy(members.firstName),
    db.select().from(attendance),
  ]);
  const presentFor = (eventId: number) => new Set(presence.filter((p) => p.eventId === eventId).map((p) => p.memberId));
  const lastCount = past[0] ? presentFor(past[0].id).size : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Jeunes inscrits" value={youth.length} />
        <Stat label="Activités à venir" value={upcoming.length} />
        <Stat label="Présents (dernière activité)" value={lastCount} />
      </div>

      <Card title="Activités">
        <details className="mb-5 rounded-xl bg-subtle p-4">
          <summary className="cursor-pointer text-sm font-medium">+ Nouvelle activité</summary>
          <form action={addEvent} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Titre"><Input name="title" required placeholder="Ex. Soirée louange & pizza" /></Field>
            <Field label="Date et heure"><Input name="startsAt" type="datetime-local" required /></Field>
            <Field label="Lieu"><Input name="location" placeholder="Salle des jeunes" /></Field>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="isPublic" defaultChecked className="accent-accent" /> Afficher sur le site</label>
            <div className="sm:col-span-2"><Field label="Description"><Textarea name="description" /></Field></div>
            <div className="sm:col-span-2 text-right"><Button type="submit">Créer l&apos;activité</Button></div>
          </form>
        </details>
        <h3 className="mb-2 text-sm font-semibold text-muted">À venir</h3>
        {upcoming.length === 0 ? <Empty>Aucune activité prévue.</Empty> : (
          <ul className="divide-y divide-line">{upcoming.map((e) => <EventRow key={e.id} event={e} youth={youth} present={presentFor(e.id)} />)}</ul>
        )}
        {past.length > 0 && (
          <>
            <h3 className="mt-6 mb-2 text-sm font-semibold text-muted">Passées</h3>
            <ul className="divide-y divide-line">{past.map((e) => <EventRow key={e.id} event={e} youth={youth} present={presentFor(e.id)} />)}</ul>
          </>
        )}
      </Card>

      <Card title="Jeunes">
        <form action={addYouth} className="mb-5 grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-4 sm:items-end">
          <Field label="Prénom"><Input name="firstName" required /></Field>
          <Field label="Nom"><Input name="lastName" required /></Field>
          <Field label="Téléphone"><Input name="phone" type="tel" /></Field>
          <Button type="submit">Ajouter</Button>
        </form>
        {youth.length === 0 ? <Empty>Aucun jeune inscrit.</Empty> : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {youth.map((m) => (
              <li key={m.id} className="flex justify-between rounded-lg border border-line px-3 py-2 text-sm">
                <span className="font-medium">{m.firstName} {m.lastName}</span>
                <span className="text-muted">{m.phone}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function EventRow({ event, youth, present }: { event: Event; youth: Member[]; present: Set<number> }) {
  return (
    <li className="py-3">
      <details>
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <span>
            <span className="font-medium">{event.title}</span>
            {!event.isPublic && <span className="ml-2 rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">Interne</span>}
            <span className="block text-sm text-muted">{formatDateTime(event.startsAt)}{event.location ? ` · ${event.location}` : ""}</span>
          </span>
          <span className="text-sm text-muted">{present.size} présent{present.size > 1 ? "s" : ""}</span>
        </summary>
        {event.description && <p className="mt-2 text-sm text-muted">{event.description}</p>}
        {youth.length > 0 && (
          <form action={saveAttendance.bind(null, event.id)} className="mt-3 rounded-xl bg-subtle p-3">
            <p className="mb-2 text-xs font-medium text-muted">Présences</p>
            <div className="grid gap-1 sm:grid-cols-3">
              {youth.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="present" value={m.id} defaultChecked={present.has(m.id)} className="accent-accent" />
                  {m.firstName} {m.lastName}
                </label>
              ))}
            </div>
            <div className="mt-3 text-right"><Button type="submit" variant="ghost">Enregistrer les présences</Button></div>
          </form>
        )}
        <form action={deleteEvent.bind(null, event.id)} className="mt-2 text-right">
          <Button variant="danger">Supprimer l&apos;activité</Button>
        </form>
      </details>
    </li>
  );
}
