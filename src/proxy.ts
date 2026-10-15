import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/token";

// Vérification rapide : chaque page revérifie aussi l'accès côté serveur.
export async function proxy(request: NextRequest) {
  const role = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!role) {
    return NextResponse.redirect(new URL("/espace", request.url));
  }
  const area = request.nextUrl.pathname.split("/")[2];
  if (role !== "admin" && area !== role) {
    return NextResponse.redirect(new URL(`/espace/${role}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/espace/:path+",
};
