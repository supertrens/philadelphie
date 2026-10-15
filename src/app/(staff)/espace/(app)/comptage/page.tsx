import { Tv } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { getAttendanceHistory, getClosedAttendance, getLiveCounts, getVisitors } from "@/lib/comptage";
import { formatSabbath, sabbathDate } from "@/lib/sabbath";
import { closeDay } from "./actions";
import { Counter } from "./counter";

export const metadata: Metadata = { title: "Comptage du Sabbat" };

export default function ComptagePage() {
  return (
    <>
      <PageHeader title="Comptage du Sabbat" subtitle="Comptez les personnes présentes en direct : adultes, enfants et visiteurs." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireStaff();
  const date = sabbathDate();
  const [counts, closed, history, visitors] = await Promise.all([getLiveCounts(date), getClosedAttendance(date), getAttendanceHistory(), getVisitors(date)]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold capitalize text-night">{formatSabbath(date)}</p>
        <a href="/espace/comptage/ecran" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-subtle">
          <Tv className="h-4 w-4" /> Ouvrir l&apos;écran (TV)
        </a>
      </div>

      <Counter initial={counts} />

      <p className="text-sm text-muted">
        {visitors.length === 0 ? "Aucun visiteur inscrit par le secrétariat pour l'instant." : `${visitors.length} visiteur${visitors.length > 1 ? "s" : ""} inscrit${visitors.length > 1 ? "s" : ""} par le secrétariat : ${visitors.map((v) => v.name).join(", ")}.`}{" "}
        <Link href="/espace/secretariat" className="font-semibold text-accent hover:underline">Inscrire un visiteur</Link> — les prénoms s&apos;affichent sur l&apos;écran de bienvenue.
      </p>

      <Card title="Clôturer le comptage">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm text-muted">
            {closed
              ? `Ce Sabbat a été clôturé par ${closed.closedBy ?? "—"} avec ${closed.total} personne${closed.total > 1 ? "s" : ""}. Clôturer à nouveau remplace ces totaux par ceux affichés ci-dessus.`
              : "À la fin du culte, enregistrez les totaux dans l'historique des présences. Vous pourrez encore corriger et clôturer à nouveau."}
          </p>
          <form action={closeDay}><Button type="submit">{closed ? "Clôturer à nouveau" : "Clôturer"}</Button></form>
        </div>
      </Card>

      <Card title="Historique des présences">
        {history.length === 0 ? <Empty>Aucun Sabbat clôturé pour l&apos;instant.</Empty> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <tr><th className="py-2 font-semibold">Sabbat</th><th className="py-2 text-right font-semibold">Adultes</th><th className="py-2 text-right font-semibold">Enfants</th><th className="py-2 text-right font-semibold">Visiteurs</th><th className="py-2 text-right font-semibold">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="py-2 capitalize">{formatSabbath(h.date)}</td>
                  <td className="py-2 text-right tabular-nums">{h.adultes}</td>
                  <td className="py-2 text-right tabular-nums">{h.enfants}</td>
                  <td className="py-2 text-right tabular-nums">{h.visiteurs}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{h.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
