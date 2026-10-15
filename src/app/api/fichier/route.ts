import { get } from "@vercel/blob";
import { getStaff } from "@/lib/auth";

/**
 * Sert un fichier du stockage privé : /api/fichier?p=<chemin>
 * - "public/…" : accessible à tous (bulletins, audio des messages)
 * - sinon : réservé au personnel connecté
 */
export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("p");
  if (!pathname || pathname.includes("..")) return new Response("Introuvable", { status: 404 });
  if (!pathname.startsWith("public/")) {
    const staff = await getStaff();
    if (!staff) return new Response("Non autorisé", { status: 401 });
  }
  const result = await get(pathname, { access: "private" });
  if (!result || !result.stream) return new Response("Introuvable", { status: 404 });
  const headers = new Headers();
  const type = result.headers.get("content-type");
  if (type) headers.set("content-type", type);
  headers.set("content-disposition", `inline; filename="${pathname.split("/").pop()}"`);
  headers.set("cache-control", pathname.startsWith("public/") ? "public, max-age=3600" : "private, no-store");
  return new Response(result.stream, { headers });
}
