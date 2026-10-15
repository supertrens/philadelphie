import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, Card, Empty, Field, Input, PageHeader, Stat, formatDate } from "@/components/ui";
import { classSessions, classes, db, teachers } from "@/db";
import { requireRole } from "@/lib/auth";
import { addClass, addSession, addTeacher, deleteClass, deleteSession, deleteTeacher } from "./actions";

export const metadata: Metadata = { title: "Enfants & École du Sabbat" };

export default function EnfantsPage() {
  return (
    <>
      <PageHeader title="Enfants & École du Sabbat" subtitle="Classes par âge, moniteurs et suivi des séances." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireRole("enfants");
  const [classList, teacherList, sessions] = await Promise.all([
    db.select().from(classes).orderBy(classes.name),
    db.select().from(teachers).orderBy(teachers.name),
    db.select().from(classSessions).orderBy(desc(classSessions.date)).limit(200),
  ]);
  const lastSabbath = sessions[0]?.date;
  const lastCount = lastSabbath ? sessions.filter((s) => s.date.getTime() === lastSabbath.getTime()).reduce((n, s) => n + s.childrenCount, 0) : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Classes" value={classList.length} />
        <Stat label="Moniteurs" value={teacherList.length} />
        <Stat label="Enfants (dernière séance)" value={lastCount} />
      </div>

      <Card title="Classes">
        <form action={addClass} className="mb-5 grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-4 sm:items-end">
          <Field label="Nom de la classe"><Input name="name" required placeholder="Ex. Jardin d’enfants" /></Field>
          <Field label="Tranche d’âge"><Input name="ageRange" placeholder="Ex. 4-6 ans" /></Field>
          <Field label="Salle"><Input name="room" /></Field>
          <Button type="submit">Créer la classe</Button>
        </form>
        {classList.length === 0 ? <Empty>Aucune classe. Créez la première ci-dessus.</Empty> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {classList.map((c) => {
              const team = teacherList.filter((t) => t.classId === c.id);
              const past = sessions.filter((s) => s.classId === c.id).slice(0, 6);
              return (
                <article key={c.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                      <p className="text-sm text-muted">{[c.ageRange, c.room].filter(Boolean).join(" · ")}</p>
                    </div>
                    <form action={deleteClass.bind(null, c.id)}><Button variant="danger">Supprimer</Button></form>
                  </div>

                  <h4 className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Moniteurs</h4>
                  <ul className="text-sm">
                    {team.map((t) => (
                      <li key={t.id} className="flex items-center justify-between py-0.5">
                        <span>{t.name}{t.phone && <span className="text-muted"> · {t.phone}</span>}</span>
                        <form action={deleteTeacher.bind(null, t.id)}><button className="px-1 text-muted hover:text-red-600" aria-label={`Retirer ${t.name}`}>×</button></form>
                      </li>
                    ))}
                  </ul>
                  <form action={addTeacher.bind(null, c.id)} className="mt-2 flex gap-2">
                    <Input name="name" required placeholder="Nom du moniteur" aria-label="Nom" />
                    <Input name="phone" placeholder="Téléphone" aria-label="Téléphone" className="w-36 shrink-0" />
                    <Button type="submit" variant="ghost" aria-label="Ajouter le moniteur">+</Button>
                  </form>

                  <h4 className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Séances</h4>
                  <form action={addSession.bind(null, c.id)} className="grid grid-cols-[1fr_5rem_auto] gap-2">
                    <Input name="date" type="date" required aria-label="Date" />
                    <Input name="childrenCount" type="number" min={0} placeholder="Enf." aria-label="Nombre d’enfants" />
                    <Button type="submit" variant="ghost" aria-label="Ajouter la séance">+</Button>
                    <Input name="lesson" placeholder="Leçon du jour" aria-label="Leçon" className="col-span-3" />
                  </form>
                  {past.length > 0 && (
                    <ul className="mt-2 text-sm">
                      {past.map((s) => (
                        <li key={s.id} className="flex items-center justify-between py-0.5">
                          <span className="capitalize">{formatDate(s.date)} <span className="text-muted">· {s.childrenCount} enfant{s.childrenCount > 1 ? "s" : ""}{s.lesson ? ` · ${s.lesson}` : ""}</span></span>
                          <form action={deleteSession.bind(null, s.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer la séance">×</button></form>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
