import { asc, desc, gte } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, Card, Empty, Field, Input, PageHeader, Stat, Textarea, formatDate } from "@/components/ui";
import { db, prayerRequests, sermonPlans, visits } from "@/db";
import { PostsCard } from "@/components/posts-card";
import { requireRole } from "@/lib/auth";
import { addPrayer, addSermonPlan, addVisit, deletePrayer, deleteSermonPlan, deleteVisit, setPrayerStatus } from "./actions";

export const metadata: Metadata = { title: "Pastorat & Anciens" };

const STATUS = { nouveau: "Nouvelle", en_priere: "En prière", exauce: "Exaucée" } as const;

export default function PastoratPage() {
  return (
    <>
      <PageHeader title="Pastorat & Anciens" subtitle="Demandes de prière, visites et planning des messages." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireRole("pastorat");
  const now = new Date();
  const [prayers, visitList, plans] = await Promise.all([
    db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt)).limit(100),
    db.select().from(visits).orderBy(desc(visits.date)).limit(30),
    db.select().from(sermonPlans).where(gte(sermonPlans.date, now)).orderBy(asc(sermonPlans.date)),
  ]);
  const open = prayers.filter((p) => p.status !== "exauce");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Prières en cours" value={open.length} />
        <Stat label="Visites (30 dernières)" value={visitList.length} />
        <Stat label="Messages planifiés" value={plans.length} />
      </div>

      <Card title="Demandes de prière">
        <details className="mb-5 rounded-xl bg-subtle p-4">
          <summary className="cursor-pointer text-sm font-medium">+ Saisir une demande reçue</summary>
          <form action={addPrayer} className="mt-4 grid gap-3">
            <Field label="Nom (optionnel)"><Input name="name" /></Field>
            <Field label="Demande"><Textarea name="message" required /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPrivate" className="accent-accent" /> Confidentielle (pastorat uniquement)</label>
            <div className="text-right"><Button type="submit">Ajouter</Button></div>
          </form>
        </details>
        {prayers.length === 0 ? <Empty>Aucune demande de prière.</Empty> : (
          <ul className="divide-y divide-line">
            {prayers.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{p.name || "Anonyme"}</span>
                      {p.email && <span className="text-muted"> · {p.email}</span>}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${p.status === "nouveau" ? "bg-gold/30 text-night" : p.status === "en_priere" ? "bg-accent/10 text-accent" : "bg-green-100 text-green-800"}`}>{STATUS[p.status as keyof typeof STATUS] ?? p.status}</span>
                      {p.isPrivate && <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">confidentielle</span>}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted">{p.message}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {p.status !== "en_priere" && <form action={setPrayerStatus.bind(null, p.id, "en_priere")}><Button variant="ghost">En prière</Button></form>}
                    {p.status !== "exauce" && <form action={setPrayerStatus.bind(null, p.id, "exauce")}><Button variant="ghost">Exaucée</Button></form>}
                    <form action={deletePrayer.bind(null, p.id)}><Button variant="danger">Supprimer</Button></form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Visites">
          <form action={addVisit} className="mb-4 grid gap-3 rounded-xl bg-subtle p-4">
            <Field label="Personne visitée"><Input name="personName" required /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><Input name="date" type="date" required /></Field>
              <Field label="Visité par"><Input name="visitedBy" placeholder="(vous)" /></Field>
            </div>
            <Field label="Notes"><Textarea name="notes" rows={2} /></Field>
            <div className="text-right"><Button type="submit">Enregistrer la visite</Button></div>
          </form>
          {visitList.length === 0 ? <Empty>Aucune visite enregistrée.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {visitList.map((v) => (
                <li key={v.id} className="flex items-start justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{v.personName}</span> <span className="text-muted">· {formatDate(v.date)} · {v.visitedBy}</span>
                    {v.notes && <span className="block text-muted">{v.notes}</span>}
                  </span>
                  <form action={deleteVisit.bind(null, v.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer">×</button></form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Planning des messages">
          <form action={addSermonPlan} className="mb-4 grid gap-3 rounded-xl bg-subtle p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><Input name="date" type="date" required /></Field>
              <Field label="Prédicateur"><Input name="speaker" required /></Field>
            </div>
            <Field label="Titre"><Input name="title" /></Field>
            <Field label="Texte biblique"><Input name="scripture" placeholder="Ex. Jean 3:16" /></Field>
            <div className="text-right"><Button type="submit">Planifier</Button></div>
          </form>
          {plans.length === 0 ? <Empty>Aucun message planifié.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {plans.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium capitalize">{formatDate(s.date)}</span> <span className="text-muted">· {s.speaker}</span>
                    {(s.title || s.scripture) && <span className="block text-muted">{[s.title, s.scripture].filter(Boolean).join(" · ")}</span>}
                  </span>
                  <form action={deleteSermonPlan.bind(null, s.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer">×</button></form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <PostsCard dept="pastorat" />
    </div>
  );
}
