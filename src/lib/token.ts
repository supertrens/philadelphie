// Jeton de session signé (HMAC-SHA256). Utilisé par le proxy et le serveur.
// Provisoire : sera remplacé par des comptes personnels (Clerk).
export const ROLES = ["admin", "secretariat", "jeunesse", "louange"] as const;
export type Role = (typeof ROLES)[number];

export const SESSION_COOKIE = "eglise_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

const encoder = new TextEncoder();

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET manquant ou trop court (32 caractères min.)");
  }
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export async function signSession(role: Role) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${role}.${expires}`;
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(payload));
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifySession(token: string | undefined): Promise<Role | null> {
  if (!token) return null;
  const [role, expires, signature] = token.split(".");
  if (!isRole(role) || !expires || !signature) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  const valid = await crypto.subtle.verify("HMAC", await getKey(), Buffer.from(signature, "base64url"), encoder.encode(`${role}.${expires}`));
  return valid ? role : null;
}
