import { count, desc, eq, gte, ilike, or, and } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { announcements, contactMessages, db, events, members } from "@/db";
import { Button, Card, Empty, Field, Input, PageHeader, Select, Stat, Textarea, formatDate, formatDateTime } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/departments";
import {
  addAnnouncement, addMember, deleteAnnouncement, deleteContactMessage, deleteMember, setContactStatus, toggleAnnouncement, updateMember,
} from "./actions";

export const metadata: Metadata = { title: "Secrétariat" };

export default function SecretariatPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Secrétariat" subtitle="Membres de l'église et annonces publiées sur le site." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type Member = typeof members.$inferSelect;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("secretariat");
  const q = String((await searchParams).q ?? "").trim();
  const search = q ? or(ilike(members.firstName, `%${q}%`), ilike(members.lastName, `%${q}%`), ilike(members.email, `%${q}%`)) : undefined;

  const [memberList, annList, inbox, [{ total }], [{ upcoming }]] = await Promise.all([
    db.select().from(members).where(search).orderBy(members.lastName, members.firstName),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100),
    db.select({ total: count() }).from(members),
    db.select({ upcoming: count() }).from(events).where(and(gte(events.startsAt, new Date()), eq(events.isPublic, true))),
  ]);
  const unread = inbox.filter((m) => m.status !== "traite");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Membres" value={total} />
        <Stat label="Messages à traiter" value={unread.length} />
        <Stat label="Annonces publiées" value={annList.filter((a) => a.published).length} />
        <Stat label="Événements à venir" value={upcoming} />
      </div>

      <Card title={`Messages reçus${unread.length ? ` (${unread.length} à traiter)` : ""}`}>
        {inbox.length === 0 ? <Empty>Aucun message reçu via le formulaire de contact.</Empty> : (
          <ul className="divide-y divide-line">
            {inbox.map((m) => (
              <li key={m.id} className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between ${m.status === "traite" ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="font-medium">
                    {m.subject}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${m.status === "traite" ? "bg-subtle text-muted" : "bg-gold/30 text-night"}`}>{m.status === "traite" ? "Traité" : "Nouveau"}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-accent hover:underline">{m.email}</a>{m.phone ? ` · ${m.phone}` : ""} · {formatDateTime(m.createdAt)}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line">{m.message}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <form action={setContactStatus.bind(null, m.id, m.status === "traite" ? "nouveau" : "traite")}>
                    <Button variant="ghost">{m.status === "traite" ? "Rouvrir" : "Marquer traité"}</Button>
                  </form>
                  <form action={deleteContactMessage.bind(null, m.id)}><Button variant="danger">Supprimer</Button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Annonces">
        <form action={addAnnouncement} className="mb-5 grid gap-3 rounded-xl bg-subtle p-4">
          <Field label="Titre"><Input name="title" required placeholder="Ex. Repas fraternel dimanche prochain" /></Field>
          <Field label="Message"><Textarea name="body" required /></Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" className="accent-accent" /> Publier sur le site</label>
            <Button type="submit">Ajouter l&apos;annonce</Button>
          </div>
        </form>
        {annList.length === 0 ? <Empty>Aucune annonce pour l&apos;instant.</Empty> : (
          <ul className="divide-y divide-line">
            {annList.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {a.title}{" "}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${a.published ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-subtle text-muted"}`}>
                      {a.published ? "Publiée" : "Brouillon"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted whitespace-pre-line">{a.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(a.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <form action={toggleAnnouncement.bind(null, a.id, !a.published)}>
                    <Button variant="ghost">{a.published ? "Dépublier" : "Publier"}</Button>
                  </form>
                  <form action={deleteAnnouncement.bind(null, a.id)}><Button variant="danger">Supprimer</Button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Membres"
        action={
          <form className="w-40 sm:w-56">
            <Input name="q" defaultValue={q} placeholder="Rechercher…" aria-label="Rechercher un membre" />
          </form>
        }
      >
        <details className="mb-5 rounded-xl bg-subtle p-4">
          <summary className="cursor-pointer text-sm font-medium">+ Ajouter un membre</summary>
          <MemberForm action={addMember} submitLabel="Ajouter" />
        </details>
        {memberList.length === 0 ? <Empty>{q ? "Aucun résultat." : "Aucun membre enregistré."}</Empty> : (
          <ul className="divide-y divide-line">
            {memberList.map((m) => (
              <li key={m.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{m.lastName.toUpperCase()} {m.firstName}</span>
                    <span className="text-sm text-muted">
                      {[m.phone, m.email, DEPARTMENTS.find((d) => d.slug === m.department)?.name].filter(Boolean).join(" · ")}
                    </span>
                  </summary>
                  <MemberForm action={updateMember.bind(null, m.id)} member={m} submitLabel="Enregistrer" />
                  <form action={deleteMember.bind(null, m.id)} className="mt-2 text-right">
                    <Button variant="danger">Supprimer ce membre</Button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MemberForm({ action, member, submitLabel }: { action: (f: FormData) => Promise<void>; member?: Member; submitLabel: string }) {
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="Prénom"><Input name="firstName" required defaultValue={member?.firstName} /></Field>
      <Field label="Nom"><Input name="lastName" required defaultValue={member?.lastName} /></Field>
      <Field label="Téléphone"><Input name="phone" type="tel" defaultValue={member?.phone ?? ""} /></Field>
      <Field label="E-mail"><Input name="email" type="email" defaultValue={member?.email ?? ""} /></Field>
      <Field label="Département">
        <Select name="department" defaultValue={member?.department ?? ""}>
          <option value="">—</option>
          {DEPARTMENTS.filter((d) => d.slug !== "secretariat").map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </Select>
      </Field>
      <Field label="Notes"><Input name="notes" defaultValue={member?.notes ?? ""} /></Field>
      <div className="sm:col-span-2 text-right"><Button type="submit">{submitLabel}</Button></div>
    </form>
  );
}
