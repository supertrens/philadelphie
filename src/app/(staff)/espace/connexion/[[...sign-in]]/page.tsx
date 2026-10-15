import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg px-4 py-16">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-col items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-display-italic text-2xl text-night">Philadelphie</span>
        </Link>
        <Suspense fallback={<div className="h-96 w-[25rem] max-w-full rounded-3xl bg-surface shadow-2xl" />}>
          <SignIn appearance={{ elements: { cardBox: "shadow-2xl rounded-3xl", card: "rounded-3xl" } }} />
        </Suspense>
        <p className="max-w-xs text-center text-xs text-muted">
          Accès réservé aux responsables. Pas encore de compte ? Demandez une invitation au secrétariat.
        </p>
      </div>
    </main>
  );
}
