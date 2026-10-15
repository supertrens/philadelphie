import { asc, gte } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { db, rota, services, setlist, songs } from "@/db";
import { Button, Card, Empty, Field, Input, PageHeader, Select, Stat, formatDate } from "@/components/ui";
import { PostsCard } from "@/components/posts-card";
import { requireRole } from "@/lib/auth";
import {
  addRota, addService, addSong, addToSetlist, deleteService, deleteSong, removeFromSetlist, removeRota,
} from "./actions";

export const metadata: Metadata = { title: "Musique & Louange" };

const ROLES = ["Direction", "Chant", "Piano / Clavier", "Guitare", "Basse", "Batterie", "Son", "Projection"];

export default function LouangePage() {
  return (
    <>
      <PageHeader title="Musique & Louange" subtitle="Planning des cultes, équipe de service et répertoire." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireRole("louange");
  // Inclut le culte du jour même s'il a commencé
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [serviceList, rotaList, setlistRows, songList] = await Promise.all([
    db.select().from(services).where(gte(services.date, today)).orderBy(asc(services.date)),
    db.select().from(rota).orderBy(rota.id),
    db.select().from(setlist).orderBy(setlist.position),
    db.select().from(songs).orderBy(songs.title),
  ]);
  const songById = new Map(songList.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Cultes planifiés" value={serviceList.length} />
        <Stat label="Chants au répertoire" value={songList.length} />
        <Stat label="Prochain culte" value={serviceList[0] ? formatDate(serviceList[0].date) : "—"} />
      </div>

      <Card title="Cultes à venir">
        <form action={addService} className="mb-5 grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-3 sm:items-end">
          <Field label="Date"><Input name="date" type="date" required /></Field>
          <Field label="Thème (optionnel)"><Input name="theme" placeholder="Ex. Sainte Cène" /></Field>
          <Button type="submit">Planifier un culte</Button>
        </form>
        {serviceList.length === 0 ? <Empty>Aucun culte planifié.</Empty> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {serviceList.map((s) => {
              const team = rotaList.filter((r) => r.serviceId === s.id);
              const songsFor = setlistRows.filter((r) => r.serviceId === s.id);
              return (
                <article key={s.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold capitalize">{formatDate(s.date)}</h3>
                      {s.theme && <p className="text-sm text-muted">{s.theme}</p>}
                    </div>
                    <form action={deleteService.bind(null, s.id)}><Button variant="danger" aria-label="Supprimer le culte">Supprimer</Button></form>
                  </div>

                  <h4 className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Équipe</h4>
                  <ul className="text-sm">
                    {team.map((r) => (
                      <li key={r.id} className="flex items-center justify-between py-0.5">
                        <span><span className="text-muted">{r.role} :</span> {r.person}</span>
                        <form action={removeRota.bind(null, r.id)}><button className="px-1 text-muted hover:text-red-600" aria-label={`Retirer ${r.person}`}>×</button></form>
                      </li>
                    ))}
                  </ul>
                  <form action={addRota.bind(null, s.id)} className="mt-2 flex gap-2">
                    <Select name="role" className="w-36 shrink-0" aria-label="Rôle">{ROLES.map((r) => <option key={r}>{r}</option>)}</Select>
                    <Input name="person" required placeholder="Nom" aria-label="Nom" />
                    <Button type="submit" variant="ghost" aria-label="Ajouter à l'équipe">+</Button>
                  </form>

                  <h4 className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Chants</h4>
                  <ol className="list-decimal pl-5 text-sm">
                    {songsFor.map((r) => {
                      const song = songById.get(r.songId);
                      return (
                        <li key={r.id} className="py-0.5">
                          <span className="flex items-center justify-between">
                            <span>{song?.title}{song?.musicalKey && <span className="text-muted"> ({song.musicalKey})</span>}</span>
                            <form action={removeFromSetlist.bind(null, r.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Retirer le chant">×</button></form>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  {songList.length > 0 ? (
                    <form action={addToSetlist.bind(null, s.id)} className="mt-2 flex gap-2">
                      <Select name="songId" aria-label="Chant">{songList.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}</Select>
                      <Button type="submit" variant="ghost" aria-label="Ajouter le chant">+</Button>
                    </form>
                  ) : <p className="text-xs text-muted">Ajoutez des chants au répertoire ci-dessous.</p>}
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Répertoire">
        <form action={addSong} className="mb-5 grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-5 sm:items-end">
          <div className="sm:col-span-2"><Field label="Titre"><Input name="title" required /></Field></div>
          <Field label="Artiste"><Input name="artist" /></Field>
          <Field label="Tonalité"><Input name="musicalKey" placeholder="Ex. Sol" /></Field>
          <Button type="submit">Ajouter</Button>
          <div className="sm:col-span-5"><Field label="Lien (YouTube, partition…)"><Input name="link" type="url" placeholder="https://" /></Field></div>
        </form>
        {songList.length === 0 ? <Empty>Le répertoire est vide.</Empty> : (
          <ul className="divide-y divide-line">
            {songList.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-muted">{[s.artist, s.musicalKey].filter(Boolean).map((x) => ` · ${x}`).join("")}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 text-accent hover:bg-subtle">Écouter</a>}
                  <form action={deleteSong.bind(null, s.id)}><Button variant="danger">Supprimer</Button></form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PostsCard dept="louange" />
    </div>
  );
}
