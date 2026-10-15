import type { NextRequest } from "next/server";
import { getStaff } from "@/lib/auth";
import { getScreenData } from "@/lib/comptage";
import { isValidScreenToken } from "@/lib/screen-token";

/**
 * Compteurs et visiteurs du Sabbat en cours. Réservé au personnel connecté,
 * ou à l'écran TV en mode kiosque avec `?k=<SCREEN_TOKEN>`.
 */
export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k");
  const allowed = k !== null ? isValidScreenToken(k) : (await getStaff()) !== null;
  if (!allowed) return Response.json({ error: "Non autorisé" }, { status: 401 });
  const counts = await getScreenData();
  return Response.json(counts, { headers: { "cache-control": "private, no-store" } });
}
