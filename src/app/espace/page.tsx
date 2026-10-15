import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Espace membres", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg px-4 py-16">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-display-italic text-2xl text-night">Philadelphie</span>
        </Link>
        <div className="mt-6 rounded-3xl border border-line bg-surface p-7 shadow-2xl">
          <h1 className="font-display text-2xl font-semibold">Espace membres</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Accès réservé aux responsables des départements.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
