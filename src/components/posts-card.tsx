import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import { db, posts } from "@/db";
import { Button, Card, Empty, Field, Input, Textarea, formatDate } from "@/components/ui";
import { type DeptSlug, deptName } from "@/lib/departments";
import { createPost, deletePost, togglePost } from "@/lib/posts/actions";
import { fileUrl } from "@/lib/public-data";
import { eglise } from "@/config/eglise";
import { FileUpload } from "./file-upload";
import { WhatsAppShare } from "./whatsapp-share";

/**
 * Carte « Publier sur le site » : formulaire de publication et liste des
 * publications du département (ou de tous les départements pour l'admin).
 */
export async function PostsCard({ dept }: { dept?: DeptSlug }) {
  const list = await db
    .select()
    .from(posts)
    .where(dept ? eq(posts.department, dept) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(dept ? 50 : 200);

  return (
    <Card title={dept ? "Publier sur le site" : "Vie de l'église — toutes les publications"} action={<a href="/fr/vie" target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent hover:underline">Voir la page publique ↗</a>}>
      <p className="mb-4 text-sm text-muted">
        {dept
          ? "Partagez les nouvelles de votre département dans la rubrique « Vie de l'église » du site public : une photo, un titre et quelques lignes."
          : "Toutes les publications des départements. Chaque responsable publie depuis sa propre page."}
      </p>
      {dept && (
        <details className="mb-5 rounded-xl bg-subtle p-4" open={list.length === 0}>
          <summary className="cursor-pointer text-sm font-medium">+ Nouvelle publication</summary>
          <form action={createPost.bind(null, dept)} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Titre"><Input name="title" required placeholder="Ex. Sortie des jeunes au lac" /></Field>
            <Field label="Photo (JPG, PNG, WebP)">
              <FileUpload name="photo" folder="public/vie" kind="image" dept={dept} accept="image/jpeg,image/png,image/webp" label="Choisir une photo" />
            </Field>
            <div className="sm:col-span-2"><Field label="Texte"><Textarea name="body" required rows={4} placeholder="Racontez en quelques lignes…" /></Field></div>
            <Field label="Title (English, optional)"><Input name="titleEn" /></Field>
            <div className="sm:col-span-2 sm:col-start-1"><Field label="Text (English, optional)"><Textarea name="bodyEn" rows={3} /></Field></div>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked className="accent-accent" /> Publié sur le site</label>
              <Button type="submit">Enregistrer la publication</Button>
            </div>
          </form>
        </details>
      )}
      {list.length === 0 ? (
        <Empty>Aucune publication pour l&apos;instant.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-night">
                {p.photoPathname ? (
                  <Image src={fileUrl(p.photoPathname)} alt="" fill sizes="6rem" className="object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display-italic text-2xl text-gold">{p.title.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.title}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-green-100 text-green-800" : "bg-subtle text-muted"}`}>{p.published ? "Publié" : "Brouillon"}</span>
                  {!dept && <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{deptName(p.department)}</span>}
                </p>
                <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-muted">{p.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(p.createdAt)} · {p.createdBy}{p.titleEn ? " · EN" : ""}
                  {p.published && <> · <a href={`/fr/vie/${p.id}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Voir</a> · <WhatsAppShare compact text={p.title} url={`${eglise.siteUrl}/fr/vie/${p.id}`} label="WhatsApp" /></>}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <form action={togglePost.bind(null, p.id, !p.published)}><Button variant="ghost">{p.published ? "Dépublier" : "Publier"}</Button></form>
                <form action={deletePost.bind(null, p.id)}><Button variant="danger">Supprimer</Button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
