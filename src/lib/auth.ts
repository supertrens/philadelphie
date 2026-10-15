import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { DeptSlug } from "./departments";
import { SESSION_COOKIE, verifySession } from "./token";

export async function getRole() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await connection(); // la vérification dépend de l'heure actuelle
  return verifySession(token);
}

/** Vérifie l'accès à un département (l'admin a accès à tout). */
export async function requireRole(dept: DeptSlug) {
  const role = await getRole();
  if (!role) redirect("/espace");
  if (role !== "admin" && role !== dept) redirect(`/espace/${role}`);
  return role;
}
