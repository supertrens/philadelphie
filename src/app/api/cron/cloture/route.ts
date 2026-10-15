import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import { closeSabbath, getClosedAttendance, getLiveCounts, lastSabbathDate } from "@/lib/comptage";

/**
 * Clôture automatique du comptage (Vercel Cron, voir vercel.json) : copie les
 * totaux du Sabbat le plus récent dans l'historique si des compteurs existent
 * et qu'aucune clôture (manuelle ou automatique) n'a encore été faite.
 * Protégée par l'en-tête `Authorization: Bearer ${CRON_SECRET}` (convention Vercel).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const date = lastSabbathDate();
  const already = await getClosedAttendance(date);
  if (already) return Response.json({ date, closed: false, reason: "déjà clôturé", total: already.total });

  const live = await getLiveCounts(date);
  if (live.updatedAt === null) return Response.json({ date, closed: false, reason: "aucun compteur" });

  const { counts, closed } = await closeSabbath(date, "Clôture automatique", "keep");
  if (closed) {
    await logAction({ userId: "cron", name: "Clôture automatique", email: "", roles: [] }, `clôture automatique (${counts.total})`, "presence", date);
    revalidatePath("/espace/comptage");
    revalidatePath("/espace/secretariat");
    revalidatePath("/espace");
  }
  return Response.json({ date, closed, total: counts.total, ...(closed ? {} : { reason: "déjà clôturé" }) });
}
