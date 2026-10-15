"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { isRole, type Role } from "@/lib/departments";

const PATH = "/espace/admin";

function rolesFrom(formData: FormData): Role[] {
  return formData.getAll("roles").map(String).filter(isRole);
}

export async function inviteUser(formData: FormData) {
  const staff = await requireRole("admin");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roles = rolesFrom(formData);
  if (!email.includes("@") || roles.length === 0) return;
  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { roles },
    redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/espace/connexion`,
    ignoreExisting: true,
  });
  await logAction(staff, "invitation", "utilisateur", email);
  revalidatePath(PATH);
}

export async function revokeInvitation(id: string) {
  const staff = await requireRole("admin");
  const client = await clerkClient();
  await client.invitations.revokeInvitation(id);
  await logAction(staff, "invitation annulée", "utilisateur", id);
  revalidatePath(PATH);
}

export async function updateRoles(userId: string, formData: FormData) {
  const staff = await requireRole("admin");
  const roles = rolesFrom(formData);
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, { publicMetadata: { roles } });
  await logAction(staff, `rôles : ${roles.join(", ") || "aucun"}`, "utilisateur", userId);
  revalidatePath(PATH);
}

export async function setBanned(userId: string, banned: boolean) {
  const staff = await requireRole("admin");
  if (userId === staff.userId) return;
  const client = await clerkClient();
  if (banned) await client.users.banUser(userId);
  else await client.users.unbanUser(userId);
  await logAction(staff, banned ? "accès suspendu" : "accès rétabli", "utilisateur", userId);
  revalidatePath(PATH);
}
