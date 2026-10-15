import { desc, gte } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FileUpload } from "@/components/file-upload";
import { Button, Card, Empty, Field, Input, PageHeader, Select, Stat, formatDate } from "@/components/ui";
import { db, expenses, offerings } from "@/db";
import { requireRole } from "@/lib/auth";
import { addExpense, addOffering, approveExpense, deleteExpense, deleteOffering } from "./actions";

export const metadata: Metadata = { title: "Trésorerie" };

const FUNDS = [
  { value: "dime", label: "Dîme" },
  { value: "offrande", label: "Offrande" },
  { value: "projet", label: "Projet / Construction" },
  { value: "autre", label: "Autre" },
];
const CATEGORIES = ["Loyer & bâtiment", "Électricité & eau", "Matériel", "Événements", "Aide sociale", "Jeunesse", "Musique", "Communication", "Autre"];
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" });
const fmt = (c: number) => money.format(c / 100);

export default function TresoreriePage() {
  return (
    <>
      <PageHeader title="Trésorerie" subtitle="Comptage des offrandes, dépenses et synthèse du mois." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireRole("tresorerie");
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [offs, exps, monthOffs, monthExps] = await Promise.all([
    db.select().from(offerings).orderBy(desc(offerings.date)).limit(50),
    db.select().from(expenses).orderBy(desc(expenses.date)).limit(50),
    db.select().from(offerings).where(gte(offerings.date, monthStart)),
    db.select().from(expenses).where(gte(expenses.date, monthStart)),
  ]);
  const totalIn = monthOffs.reduce((s, o) => s + o.amountCents, 0);
  const totalOut = monthExps.reduce((s, e) => s + e.amountCents, 0);
  const byFund = FUNDS.map((f) => ({ ...f, total: monthOffs.filter((o) => o.fund === f.value).reduce((s, o) => s + o.amountCents, 0) }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Entrées ce mois" value={fmt(totalIn)} />
        <Stat label="Dépenses ce mois" value={fmt(totalOut)} />
        <Stat label="Solde du mois" value={fmt(totalIn - totalOut)} />
      </div>

      <Card title="Répartition du mois par fonds">
        <ul className="grid gap-2 sm:grid-cols-4">
          {byFund.map((f) => (
            <li key={f.value} className="rounded-xl border border-line p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{f.label}</p>
              <p className="font-display text-xl font-semibold">{fmt(f.total)}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Offrandes">
          <form action={addOffering} className="mb-4 grid gap-3 rounded-xl bg-subtle p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Date"><Input name="date" type="date" required /></Field>
              <Field label="Fonds"><Select name="fund">{FUNDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></Field>
              <Field label="Montant ($)"><Input name="amount" inputMode="decimal" required placeholder="0.00" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Compté par"><Input name="countedBy" placeholder="(vous)" /></Field>
              <Field label="Notes"><Input name="notes" /></Field>
            </div>
            <div className="text-right"><Button type="submit">Enregistrer</Button></div>
          </form>
          {offs.length === 0 ? <Empty>Aucune offrande enregistrée.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {offs.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                  <span><span className="font-medium">{fmt(o.amountCents)}</span> <span className="text-muted">· {FUNDS.find((f) => f.value === o.fund)?.label ?? o.fund} · {formatDate(o.date)} · {o.countedBy}</span></span>
                  <form action={deleteOffering.bind(null, o.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer">×</button></form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Dépenses">
          <form action={addExpense} className="mb-4 grid gap-3 rounded-xl bg-subtle p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Date"><Input name="date" type="date" required /></Field>
              <Field label="Catégorie"><Select name="category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label="Montant ($)"><Input name="amount" inputMode="decimal" required placeholder="0.00" /></Field>
            </div>
            <Field label="Description"><Input name="description" /></Field>
            <FileUpload name="receipt" folder="tresorerie/recus" dept="tresorerie" kind="document" accept="application/pdf,image/*" label="Joindre le reçu" />
            <div className="text-right"><Button type="submit">Enregistrer</Button></div>
          </form>
          {exps.length === 0 ? <Empty>Aucune dépense enregistrée.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {exps.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{fmt(e.amountCents)}</span> <span className="text-muted">· {e.category} · {formatDate(e.date)}</span>
                    {e.description && <span className="block text-muted">{e.description}</span>}
                    <span className="block text-xs">
                      {e.receiptPathname && <a href={`/api/fichier?p=${encodeURIComponent(e.receiptPathname)}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Reçu</a>}
                      {e.approvedBy ? <span className="ml-2 text-green-700">Approuvée par {e.approvedBy}</span> : <span className="ml-2 text-muted">En attente d’approbation</span>}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {!e.approvedBy && <form action={approveExpense.bind(null, e.id)}><Button variant="ghost">Approuver</Button></form>}
                    <form action={deleteExpense.bind(null, e.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer">×</button></form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
