import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Reveal } from "@/components/reveal";
import { eglise } from "@/config/eglise";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale } from "@/i18n/locales";
import { ContactForm } from "./contact-form";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.contact.eyebrow,
    description: t.contactPage.metaDescription,
    alternates: { canonical: `/${lang}/contact`, languages: { fr: "/fr/contact", en: "/en/contact" } },
  };
}

export default async function ContactPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <>
      <PageIntro lang={lang} eyebrow={t.contactPage.eyebrow} title={t.contactPage.title} text={t.contactPage.text} back={t.common.home} />
      <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <dl className="divide-y hairline">
              <div className="flex gap-4 py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night text-gold"><MapPin className="h-4 w-4" /></span>
                <span>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.contact.address}</dt>
                  <dd className="mt-1 font-display text-xl">{eglise.adresse}</dd>
                  <a href={eglise.carte} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">{t.contact.directions} <ArrowUpRight className="h-3.5 w-3.5" /></a>
                </span>
              </div>
              <div className="flex gap-4 py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night text-gold"><Mail className="h-4 w-4" /></span>
                <span>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.contact.email}</dt>
                  <dd className="mt-1 font-display text-xl"><a href={`mailto:${eglise.email}`} className="hover:text-accent">{eglise.email}</a></dd>
                </span>
              </div>
              {eglise.telephone && (
                <div className="flex gap-4 py-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night text-gold"><Phone className="h-4 w-4" /></span>
                  <span>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.contact.phone}</dt>
                    <dd className="mt-1 font-display text-xl">{eglise.telephone}</dd>
                  </span>
                </div>
              )}
            </dl>
            <p className="mt-6 rounded-3xl border-l-4 border-gold bg-surface p-5 text-sm text-muted shadow-sm">{t.contactPage.hours}</p>
            <div className="mt-6 h-64 overflow-hidden rounded-[2rem] border hairline shadow-xl">
              <iframe title={t.contact.map} src={eglise.carteEmbed} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <ContactForm t={{ ...t.contactPage, sending: t.common.sending, errorGeneric: t.common.errorGeneric, tooFast: t.common.tooFast }} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
