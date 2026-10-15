import "server-only";
import { auditLog, db } from "@/db";
import type { Staff } from "./auth";

/** Journalise une action de l'espace membres (qui, quoi, sur quoi). */
export async function logAction(staff: Staff, action: string, entity: string, entityId?: number | string) {
  await db.insert(auditLog).values({
    userId: staff.userId,
    userName: staff.name,
    action,
    entity,
    entityId: entityId === undefined ? null : String(entityId),
  });
}
