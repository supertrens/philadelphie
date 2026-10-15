import { frFR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { fontClass } from "@/app/fonts";
import { eglise } from "@/config/eglise";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: `Espace membres · ${eglise.nom}`, template: `%s · Espace membres` },
  robots: { index: false, follow: false },
};

// Mise en page racine de l'espace membres (toujours en français)
export default function StaffRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontClass}>
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider
          localization={frFR}
          appearance={{
            variables: { colorPrimary: "#003f88", borderRadius: "0.75rem", fontFamily: "var(--font-inter)" },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
