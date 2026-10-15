import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fontClass } from "@/app/fonts";
import { eglise } from "@/config/eglise";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale, LOCALES } from "@/i18n/locales";
import "@/app/globals.css";

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    metadataBase: new URL(eglise.siteUrl),
    title: { default: eglise.nom, template: `%s · ${eglise.nom}` },
    description: t.meta.description,
    applicationName: eglise.nom,
    alternates: { canonical: `/${lang}`, languages: { fr: "/fr", en: "/en" } },
    // Sans titre ni description ici : chaque page fournit les siens (og:title suit le <title>)
    openGraph: { siteName: eglise.nom, locale: lang === "fr" ? "fr_FR" : "en_US", alternateLocale: lang === "fr" ? "en_US" : "fr_FR", type: "website" },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

// Mise en page racine du site public (préfixe de langue /fr ou /en)
export default async function PublicRootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang} className={fontClass}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
