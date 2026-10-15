import { Tv } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { ConfirmForm } from "@/components/confirm-form";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { getAttendanceHistory, getClosedAttendance, getScreenData } from "@/lib/comptage";
import { formatSabbath, sabbathDate } from "@/lib/sabbath";
import { screenToken } from "@/lib/screen-token";
import { closeDay, resetDay } from "./actions";
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
  const [data, closed, history] = await Promise.all([getScreenData(date), getClosedAttendance(date), getAttendanceHistory()]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold capitalize text-night">{formatSabbath(date)}</p>
        <a href="/espace/comptage/ecran" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-subtle">
          <Tv className="h-4 w-4" /> Ouvrir l&apos;écran (TV)
        </a>
      </div>

      <Counter initial={data} />

      <Suspense fallback={null}>
        <ScreenLinkCard />
      </Suspense>

      <Card title="Clôturer le comptage">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm text-muted">
            {closed
              ? `Ce Sabbat a été clôturé par ${closed.closedBy ?? "—"} avec ${closed.total} personne${closed.total > 1 ? "s" : ""}. Clôturer à nouveau remplace ces totaux par ceux affichés ci-dessus.`
              : "À la fin du culte, enregistrez les totaux dans l'historique des présences. Vous pourrez encore corriger et clôturer à nouveau. Sans clôture manuelle, les totaux sont enregistrés automatiquement le samedi soir."}
          </p>
          <form action={closeDay}><Button type="submit">{closed ? "Clôturer à nouveau" : "Clôturer"}</Button></form>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="max-w-xl text-xs text-muted">Après des essais ou avant de commencer un vrai comptage : remet les trois compteurs à zéro et retire les visiteurs inscrits du jour. Une clôture déjà enregistrée n&apos;est pas modifiée.</p>
          <ConfirmForm action={resetDay} message={`Remettre à zéro le comptage du ${formatSabbath(date)} ? Les compteurs et les visiteurs inscrits du jour seront effacés.`}>
            <Button type="submit" variant="danger">Remettre à zéro</Button>
          </ConfirmForm>
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

/** Lien de l'écran TV sans connexion (mode kiosque), affiché seulement si SCREEN_TOKEN est défini. */
async function ScreenLinkCard() {
  const token = screenToken();
  if (!token) return null;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/espace/comptage/ecran?k=${encodeURIComponent(token)}`;
  return (
    <Card title="Écran TV sans connexion">
      <p className="text-sm text-muted">
        Ouvrez ce lien dans le navigateur de la télévision : l&apos;écran s&apos;affiche sans mot de passe et se met à jour tout seul.
        Il donne accès aux chiffres et aux noms affichés, ne le partagez qu&apos;avec la personne qui installe la TV.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input readOnly value={url} aria-label="Lien de l'écran TV" className="min-w-0 flex-1 rounded-lg border border-line bg-subtle px-3 py-2 font-mono text-xs text-ink" />
        <CopyButton text={url} />
      </div>
    </Card>
  );
}
