import { getStaff } from "@/lib/auth";
import { getScreenData } from "@/lib/comptage";

/** Compteurs et visiteurs du Sabbat en cours (réservé au personnel connecté). */
export async function GET() {
  const staff = await getStaff();
  if (!staff) return Response.json({ error: "Non autorisé" }, { status: 401 });
  const counts = await getScreenData();
  return Response.json(counts, { headers: { "cache-control": "private, no-store" } });
}
