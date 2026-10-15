import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES, pickLocale } from "@/i18n/locales";

// Espace membres : réservé aux utilisateurs connectés (sauf la page de connexion)
const isStaff = createRouteMatcher(["/espace(.*)", "/api/upload(.*)"]);
const isSignIn = createRouteMatcher(["/espace/connexion(.*)"]);
const isApi = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isStaff(req)) {
    if (!isSignIn(req)) await auth.protect();
    return;
  }
  if (isApi(req)) return;

  // Site public : préfixe de langue (/fr, /en)
  const { pathname } = req.nextUrl;
  const current = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (current) {
    const res = NextResponse.next();
    res.cookies.set("lang", current, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  const locale = pickLocale(req.cookies.get("lang")?.value, req.headers.get("accept-language")) ?? DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les internes Next.js
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|pdf|mp3)).*)",
    "/(api|trpc)(.*)",
  ],
};
