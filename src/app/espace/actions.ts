"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRole, type Role, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/token";

const PASSWORDS: Record<Role, string | undefined> = {
  admin: process.env.PASS_ADMIN,
  secretariat: process.env.PASS_SECRETARIAT,
  jeunesse: process.env.PASS_JEUNESSE,
  louange: process.env.PASS_LOUANGE,
};

function samePassword(a: string, b: string) {
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const role = formData.get("role");
  const password = formData.get("password");
  if (!isRole(role) || typeof password !== "string") return { error: "Formulaire invalide." };
  const expected = PASSWORDS[role];
  if (!expected || !samePassword(password, expected)) return { error: "Mot de passe incorrect." };
  (await cookies()).set(SESSION_COOKIE, await signSession(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(role === "admin" ? "/espace/secretariat" : `/espace/${role}`);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/espace");
}
