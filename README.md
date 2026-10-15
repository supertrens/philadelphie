# Église Adventiste Philadelphie — site et espace membres

Next.js 16 (cacheComponents), Tailwind v4, Neon Postgres + Drizzle, Clerk, Vercel Blob, Resend (optionnel).
Déploiement : chaque push sur `main` est déployé par Vercel.

## Démarrer

```bash
npm install
vercel env pull        # DATABASE_URL, Clerk, Blob…
npm run dev            # http://localhost:3000
```

Les variables attendues sont listées et commentées dans `.env.example`.
Schéma de base : `src/db/schema.ts`, appliqué avec `npx drizzle-kit push`.

## Comptage du Sabbat

- `/espace/comptage` : compteurs en direct (adultes, enfants, visiteurs), clôture manuelle, historique.
- `/espace/comptage/ecran` : écran plein format pour la télévision. Avec `SCREEN_TOKEN` défini,
  `/espace/comptage/ecran?k=<jeton>` s'ouvre sans compte (mode kiosque) ; la page Comptage affiche ce lien à copier.
- Clôture automatique : `vercel.json` déclenche `GET /api/cron/cloture` (protégé par `CRON_SECRET`) avec le cron
  `55 3 * * 0`. Vercel interprète les crons en **UTC** : dimanche 03:55 UTC = **samedi 23:55 à Indianapolis à l'heure
  d'été (EDT, UTC−4)** et samedi 22:55 à l'heure d'hiver (EST, UTC−5). La route clôture le Sabbat le plus récent
  (samedi en cours ou passé, heure d'Indianapolis), uniquement si des compteurs existent et qu'aucune clôture n'a été
  faite : une clôture manuelle n'est jamais écrasée. Sur l'offre Hobby, Vercel peut exécuter le cron avec jusqu'à une
  heure de retard ; la route gère ce cas (elle vise encore le samedi écoulé).

## Formulaires publics (contact, prière)

Anti-spam sans CAPTCHA : champ pot de miel caché (`website`) ignoré silencieusement s'il est rempli, et refus si
l'envoi arrive moins de 3 secondes après l'affichage du formulaire (`src/lib/anti-spam.ts`).
