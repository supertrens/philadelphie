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
    title: { default: eglise.nom, template: `%s · ${eglise.nom}` },
    description: t.meta.description,
    alternates: { languages: { fr: "/fr", en: "/en" } },
    openGraph: { title: eglise.nom, description: t.meta.description, locale: lang === "fr" ? "fr_FR" : "en_US", type: "website" },
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
