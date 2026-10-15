import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { type DeptSlug, isRole, type Role } from "./departments";

export type Staff = {
  userId: string;
  name: string;
  email: string;
  roles: Role[];
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Utilisateur connecté et ses rôles (Clerk `publicMetadata.roles`). */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;
  const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
  const raw = (user.publicMetadata as { roles?: unknown }).roles;
  const roles = (Array.isArray(raw) ? raw : []).filter(isRole);
  // Les adresses listées dans ADMIN_EMAILS sont toujours administratrices
  if (ADMIN_EMAILS.includes(email.toLowerCase()) && !roles.includes("admin")) roles.push("admin");
  return {
    userId,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || email,
    email,
    roles,
  };
});

export function can(staff: Staff | null, dept: DeptSlug | "admin") {
  if (!staff) return false;
  return staff.roles.includes("admin") || staff.roles.includes(dept);
}

/** Vérifie l'accès à un département (l'admin a accès à tout). */
export async function requireRole(dept: DeptSlug | "admin") {
  const staff = await getStaff();
  if (!staff) redirect("/espace/connexion");
  if (!can(staff, dept)) redirect("/espace");
  return staff;
}

export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/espace/connexion");
  return staff;
}
