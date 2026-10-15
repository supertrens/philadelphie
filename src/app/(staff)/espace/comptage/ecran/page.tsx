import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { eglise } from "@/config/eglise";
import { getStaff } from "@/lib/auth";
import { getScreenData } from "@/lib/comptage";
import { formatSabbath, sabbathDate } from "@/lib/sabbath";
import { isValidScreenToken } from "@/lib/screen-token";
import { Screen } from "./screen";

export const metadata: Metadata = { title: "Écran de comptage" };

type SearchParams = Promise<{ k?: string | string[] }>;

/** Écran plein format pour une télévision (sans barre latérale). */
export default function EcranPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-night" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  // Toujours rendu à la requête (date du Sabbat, compteurs en direct), jamais prérendu
  await connection();
  // Mode kiosque (TV) : le jeton SCREEN_TOKEN remplace la session ; sinon personnel connecté
  const { k } = await searchParams;
  if (k !== undefined) {
    if (!isValidScreenToken(typeof k === "string" ? k : null)) return <Unauthorized />;
  } else if (!(await getStaff())) {
    redirect("/espace/connexion");
  }
  const date = sabbathDate();
  const data = await getScreenData(date);
  return <Screen initial={data} title={eglise.nom} dateLabel={formatSabbath(date)} />;
}

function Unauthorized() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-night px-8 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Non autorisé</p>
      <p className="font-display text-3xl">Le lien de cet écran n&apos;est pas valide.</p>
      <p className="max-w-md text-sm text-white/60">Demandez au secrétariat le lien à jour depuis la page « Comptage du Sabbat ».</p>
    </div>
  );
}
