import { getLiveCounts } from "@/lib/comptage";

/** Total public des présences du Sabbat en cours (mis en cache 5 s). */
export async function GET() {
  const { total } = await getLiveCounts();
  return Response.json({ total }, { headers: { "cache-control": "public, max-age=5, s-maxage=5, stale-while-revalidate=5" } });
}
