"use client";

import { upload } from "@vercel/blob/client";
import { Loader2, Paperclip } from "lucide-react";
import { useId, useState } from "react";

/**
 * Champ de fichier qui envoie directement vers le stockage Blob puis remplit
 * un champ caché `name` avec le chemin du fichier (pour l'action serveur).
 */
export function FileUpload({
  name,
  folder,
  kind = "document",
  dept,
  accept,
  label = "Choisir un fichier",
}: {
  name: string;
  /** ex. "media/bulletins" ou "public/bulletins" */
  folder: string;
  kind?: "pdf" | "image" | "audio" | "document";
  /** Département autorisant l'envoi (obligatoire pour un dossier "public/…") */
  dept: string;
  accept?: string;
  label?: string;
}) {
  const id = useId();
  const [pathname, setPathname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await upload(`${folder}/${file.name}`, file, {
        access: "private",
        handleUploadUrl: `/api/upload?kind=${kind}`,
        clientPayload: dept,
      });
      setPathname(blob.pathname);
    } catch (err) {
      setError((err as Error).message || "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 text-xs font-medium text-muted">
      <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-medium text-ink hover:bg-subtle">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {pathname ? pathname.split("/").pop() : label}
      </label>
      <input id={id} type="file" accept={accept} onChange={onChange} className="sr-only" />
      <input type="hidden" name={name} value={pathname} />
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
