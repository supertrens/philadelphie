import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { FileUpload } from "@/components/file-upload";
import { Button, Card, Empty, Field, Input, PageHeader, Select, Stat, formatDate } from "@/components/ui";
import { bulletins, db, mediaPosts, sermons, settings } from "@/db";
import { PostsCard } from "@/components/posts-card";
import { requireRole } from "@/lib/auth";
import {
  addBulletin, addPost, addSermon, deleteBulletin, deletePost, deleteSermon, saveLiveSettings, setPostStatus, toggleSermon,
} from "./actions";

export const metadata: Metadata = { title: "Média & Communication" };

const KINDS = { photo: "Photo", social: "Réseaux sociaux", annonce: "Annonce visuelle" } as const;
const STATUS = { idee: "Idée", pret: "Prêt", publie: "Publié" } as const;

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Média & Communication" subtitle="Messages vidéo, culte en direct, bulletin et publications." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireRole("media");
  const [sermonList, bulletinList, posts, settingRows] = await Promise.all([
    db.select().from(sermons).orderBy(desc(sermons.date)).limit(50),
    db.select().from(bulletins).orderBy(desc(bulletins.weekOf)).limit(20),
    db.select().from(mediaPosts).orderBy(desc(mediaPosts.id)).limit(50),
    db.select().from(settings),
  ]);
  const setting = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Messages publiés" value={sermonList.filter((s) => s.published).length} />
        <Stat label="Bulletins" value={bulletinList.length} />
        <Stat label="Direct" value={setting.live_now === "1" ? "EN COURS" : "hors ligne"} />
      </div>

      <Card title="Culte en direct">
        <form action={saveLiveSettings} className="grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Lien du direct (YouTube)"><Input name="liveUrl" type="url" defaultValue={setting.live_url ?? ""} placeholder="https://www.youtube.com/live/…" /></Field>
          <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="liveNow" defaultChecked={setting.live_now === "1"} className="accent-accent" /> En direct maintenant</label>
          <Button type="submit">Enregistrer</Button>
        </form>
        <p className="mt-2 text-xs text-muted">Le site affiche un badge « En direct » et le lien ci-dessus tant que la case est cochée.</p>
      </Card>

      <Card title="Messages (sermons)">
        <details className="mb-5 rounded-xl bg-subtle p-4">
          <summary className="cursor-pointer text-sm font-medium">+ Ajouter un message</summary>
          <form action={addSermon} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Titre"><Input name="title" required /></Field>
            <Field label="Date"><Input name="date" type="date" required /></Field>
            <Field label="Prédicateur"><Input name="speaker" /></Field>
            <Field label="Série"><Input name="series" /></Field>
            <Field label="Texte biblique"><Input name="scripture" /></Field>
            <Field label="Vidéo YouTube (lien ou identifiant)"><Input name="youtube" placeholder="https://youtu.be/…" /></Field>
            <div className="sm:col-span-2"><FileUpload name="audio" folder="public/messages" dept="media" kind="audio" accept="audio/*" label="Joindre l’audio (MP3)" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked className="accent-accent" /> Visible sur le site</label>
            <div className="text-right"><Button type="submit">Ajouter</Button></div>
          </form>
        </details>
        {sermonList.length === 0 ? <Empty>Aucun message enregistré.</Empty> : (
          <ul className="divide-y divide-line">
            {sermonList.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-4 py-3">
                {s.youtubeId ? (
                  <Image src={`https://i.ytimg.com/vi/${s.youtubeId}/mqdefault.jpg`} alt="" width={96} height={54} className="rounded-lg object-cover" />
                ) : <span className="grid h-[54px] w-24 place-items-center rounded-lg bg-subtle text-xs text-muted">audio</span>}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{s.title} {!s.published && <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">brouillon</span>}</span>
                  <span className="block text-sm text-muted">{[formatDate(s.date), s.speaker, s.series, s.scripture].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="flex gap-1">
                  <form action={toggleSermon.bind(null, s.id, !s.published)}><Button variant="ghost">{s.published ? "Masquer" : "Publier"}</Button></form>
                  <form action={deleteSermon.bind(null, s.id)}><Button variant="danger">Supprimer</Button></form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Bulletin hebdomadaire">
          <form action={addBulletin} className="mb-4 grid gap-3 rounded-xl bg-subtle p-4">
            <Field label="Sabbat du"><Input name="weekOf" type="date" required /></Field>
            <FileUpload name="file" folder="public/bulletins" dept="media" kind="pdf" accept="application/pdf" label="Choisir le PDF" />
            <Field label="Notes"><Input name="notes" /></Field>
            <div className="text-right"><Button type="submit">Mettre en ligne</Button></div>
          </form>
          {bulletinList.length === 0 ? <Empty>Aucun bulletin en ligne.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {bulletinList.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                  <span><a href={`/api/fichier?p=${encodeURIComponent(b.pathname)}`} target="_blank" rel="noreferrer" className="font-medium capitalize text-accent hover:underline">Bulletin du {formatDate(b.weekOf)}</a>{b.notes && <span className="text-muted"> · {b.notes}</span>}</span>
                  <form action={deleteBulletin.bind(null, b.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer">×</button></form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Publications & photos">
          <form action={addPost} className="mb-4 grid gap-3 rounded-xl bg-subtle p-4">
            <Field label="Titre"><Input name="title" required /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type"><Select name="kind">{Object.entries(KINDS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
              <Field label="Publier le"><Input name="publishAt" type="date" /></Field>
            </div>
            <Field label="Lien (optionnel)"><Input name="link" type="url" /></Field>
            <FileUpload name="file" folder="media/publications" dept="media" kind="image" accept="image/*" label="Joindre une image" />
            <div className="text-right"><Button type="submit">Ajouter</Button></div>
          </form>
          {posts.length === 0 ? <Empty>Aucune publication planifiée.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {posts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{p.title}</span> <span className="text-muted">· {KINDS[p.kind as keyof typeof KINDS] ?? p.kind}{p.publishAt ? ` · ${formatDate(p.publishAt)}` : ""}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${p.status === "publie" ? "bg-green-100 text-green-800" : p.status === "pret" ? "bg-accent/10 text-accent" : "bg-subtle text-muted"}`}>{STATUS[p.status as keyof typeof STATUS] ?? p.status}</span>
                    {p.pathname && <a href={`/api/fichier?p=${encodeURIComponent(p.pathname)}`} target="_blank" rel="noreferrer" className="ml-2 text-accent hover:underline">fichier</a>}
                  </span>
                  <span className="flex gap-1">
                    {p.status !== "pret" && <form action={setPostStatus.bind(null, p.id, "pret")}><Button variant="ghost">Prêt</Button></form>}
                    {p.status !== "publie" && <form action={setPostStatus.bind(null, p.id, "publie")}><Button variant="ghost">Publié</Button></form>}
                    <form action={deletePost.bind(null, p.id)}><button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer">×</button></form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <PostsCard dept="media" />
    </div>
  );
}
