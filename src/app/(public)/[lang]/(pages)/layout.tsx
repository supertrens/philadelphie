import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { eglise } from "@/config/eglise";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { getLiveStatus } from "@/lib/public-data";

/** Pages intérieures : en-tête, contenu, pied de page. */
export default async function PagesLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, status] = await Promise.all([getDictionary(lang), getLiveStatus()]);
  return (
    <>
      <SiteHeader lang={lang} nav={t.nav} sousTitre={eglise.t(lang).sousTitre} live={status.live} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} t={{ ...t.footer, espace: t.nav.espace }} nav={t.nav} />
    </>
  );
}
