import type { Metadata } from "next";
import { Suspense } from "react";
import { eglise } from "@/config/eglise";
import { requireStaff } from "@/lib/auth";
import { getScreenData } from "@/lib/comptage";
import { formatSabbath, sabbathDate } from "@/lib/sabbath";
import { Screen } from "./screen";

export const metadata: Metadata = { title: "Écran de comptage" };

/** Écran plein format pour une télévision (sans barre latérale). */
export default function EcranPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-night" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireStaff();
  const date = sabbathDate();
  const data = await getScreenData(date);
  return <Screen initial={data} title={eglise.nom} dateLabel={formatSabbath(date)} />;
}
