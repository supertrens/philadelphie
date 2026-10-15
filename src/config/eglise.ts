// Informations de l'église — modifiez ce fichier pour personnaliser le site.
// Les textes existent en français (fr) et en anglais (en).
import type { Locale } from "@/i18n/locales";

const textes = {
  fr: {
    slogan: "Une famille pour croire, grandir et servir ensemble.",
    description:
      "Église adventiste francophone au cœur d'Indianapolis. Cultes le Sabbat, École du Sabbat, jeunesse, louange et une communauté chaleureuse qui vous attend.",
    sousTitre: "Église Adventiste du Septième Jour · Indianapolis",
    cultes: [
      { jour: "Sabbat (samedi)", heure: "9h30", nom: "École du Sabbat", detail: "Étude de la Bible en petits groupes, pour tous les âges." },
      { jour: "Sabbat (samedi)", heure: "11h00", nom: "Culte divin", detail: "Louange, prière et message. Garderie disponible." },
      { jour: "Sabbat (samedi)", heure: "16h00", nom: "Jeunesse Adventiste (JA)", detail: "Rencontre des jeunes : activités, partage et louange." },
      { jour: "Mercredi", heure: "19h00", nom: "Réunion de prière", detail: "Un temps de prière et d'étude en milieu de semaine." },
    ],
    // Brouillon à relire par le pasteur
    motDuPasteur: {
      auteur: "L'équipe pastorale",
      texte:
        "Philadelphie, c'est d'abord une famille. Des gens venus d'Haïti, d'Afrique, d'Europe et d'ici, qui se retrouvent chaque Sabbat pour louer Dieu en français et s'encourager. Si vous cherchez un lieu où l'on vous appelle par votre prénom, où vos enfants sont attendus et où la Bible est ouverte avec sérieux et joie : vous êtes arrivé.",
    },
    verset: { texte: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", reference: "Matthieu 11:28" },
  },
  en: {
    slogan: "A family to believe, to grow and to serve together.",
    description:
      "A French-speaking Seventh-day Adventist church in the heart of Indianapolis. Sabbath worship, Sabbath School, youth, praise and a warm community waiting for you.",
    sousTitre: "Seventh-day Adventist Church · Indianapolis",
    cultes: [
      { jour: "Sabbath (Saturday)", heure: "9:30 AM", nom: "Sabbath School", detail: "Bible study in small groups, for every age." },
      { jour: "Sabbath (Saturday)", heure: "11:00 AM", nom: "Divine Service", detail: "Praise, prayer and the message. Nursery available." },
      { jour: "Sabbath (Saturday)", heure: "4:00 PM", nom: "Adventist Youth (AY)", detail: "Youth gathering: activities, sharing and praise." },
      { jour: "Wednesday", heure: "7:00 PM", nom: "Prayer meeting", detail: "A midweek time of prayer and study." },
    ],
    motDuPasteur: {
      auteur: "The pastoral team",
      texte:
        "Philadelphie is first of all a family. People from Haiti, Africa, Europe and right here, who gather every Sabbath to praise God in French and encourage one another. If you are looking for a place where people know your name, where your children are expected and where the Bible is opened with seriousness and joy: you have arrived.",
    },
    verset: { texte: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
  },
} as const;

export const eglise = {
  nom: "Église Adventiste Philadelphie",
  nomCourt: "Philadelphie",
  // Adresse publique du site (sans barre oblique finale) — utilisée pour le SEO
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://philadelphiesdachurch.com",
  adresse: "3642 North Emerson Avenue, Indianapolis, IN",
  carte: "https://maps.google.com/?q=3642+North+Emerson+Avenue,+Indianapolis,+IN",
  carteEmbed: "https://maps.google.com/maps?q=3642+North+Emerson+Avenue,+Indianapolis,+IN&z=15&output=embed",
  telephone: "", // à venir
  email: "contact@philadelphiesdachurch.com",
  // Chaîne YouTube de l'église : directs du Sabbat et messages (lus automatiquement, voir src/lib/youtube.ts)
  youtube: "https://www.youtube.com/@philadelphiefrench-haitian1191",
  youtubeChannelId: "UCWvwtgNE1m4Q6WjXVGooA2A",
  facebook: "",
  // Dons en ligne : page AdventistGiving de l'église
  don: "https://adventistgiving.org/donate/ANF82G",
  // Créneaux (heure d'Indianapolis) : 0 = dimanche … 6 = samedi ; index = ligne de `cultes`
  creneaux: [
    { weekday: 6, hour: 9, minute: 30, index: 0 },
    { weekday: 6, hour: 11, minute: 0, index: 1 },
    { weekday: 6, hour: 16, minute: 0, index: 2 },
    { weekday: 3, hour: 19, minute: 0, index: 3 },
  ],
  // Photos de remplacement (Unsplash). À remplacer par des photos de l'église.
  photos: {
    hero: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1800&q=80&auto=format&fit=crop",
    communaute: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80&auto=format&fit=crop",
    louange: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80&auto=format&fit=crop",
    jeunesse: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80&auto=format&fit=crop",
    enfants: "https://images.unsplash.com/photo-1445445290350-18a3b86e0b5a?w=1200&q=80&auto=format&fit=crop",
    priere: "https://images.unsplash.com/photo-1476234251651-f353703a034d?w=1200&q=80&auto=format&fit=crop",
    assemblee: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80&auto=format&fit=crop",
  },
  textes,
  // Textes du site public dans la langue demandée
  t: (lang: Locale) => textes[lang],
  // Textes français pour l'espace membres
  fr: textes.fr,
};
