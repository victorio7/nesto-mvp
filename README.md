# Nesto

Base Next.js pour Nesto, bras droit commercial en immobilier pilote depuis WhatsApp : qualification prospects, surveillance du site agence, matching, relances et votre validation des actions importantes.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/Storage prepare
- OpenAI API pour l'analyse, l'extraction et les relances
- Vercel-ready
- WhatsApp Cloud API preparee avec simulation V1
- Stripe prepare avec mode test/simulation

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables attendues :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
META_APP_SECRET=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_ASSISTANT_99=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Sans `OPENAI_API_KEY`, les fonctions IA utilisent un fallback heuristique pour permettre de tester la V1.

## Routes principales

- `/` landing publique
- `/login` et `/signup` auth simulee
- `/dashboard` espace de controle
- `/billing` pack 99 euros / mois, engagement 6 mois, checkout simule si Stripe absent
- `/onboarding` installation guidee apres inscription/paiement
- `/whatsapp-simulator` simulateur V1 des flux WhatsApp prospect/agent
- `/api/billing/checkout` Stripe Checkout ou redirection simulee
- `/api/stripe/webhook` webhooks Stripe Billing
- `/contacts` et `/contacts/[id]`
- `/properties` et `/properties/[id]`
- `/settings/property-sources`
- `/properties/import`
- `/messages/analyze`
- `/matches`
- `/followups`
- `/actions`
- `/settings/autonomy`

## Fonctionnel en V1

- Interface SaaS complete avec donnees de demonstration
- Landing commerciale centree sur WhatsApp
- Espace de controle simplifie : installation, sources, commandes WhatsApp, activite recente
- Onboarding installation en 7 etapes
- Paiement 99 euros / mois avec simulation de checkout
- Stripe Checkout/Billing pret pour `STRIPE_PRICE_ID_ASSISTANT_99`
- Webhook Stripe : checkout, subscription created/updated/deleted, invoice paid/failed
- Middleware de protection des routes internes avec session demo et compatibilite cookies Supabase
- Headers de securite Next.js : CSP, frame deny, nosniff, referrer policy, permissions policy
- Validation serveur pour inscription, onboarding, import URL et sources site agence
- Fiches contacts et biens
- Import de bien avec `parsePropertyWithAI(rawContent)`
- Analyse de message avec `analyzeProspectMessageWithAI(rawMessage, agencyContext)`
- Detection des informations manquantes
- Matching prospects/biens avec `calculateMatch(contact, property)`
- Relances IA avec fallback local
- Actions proposees avec validation/modification/refus dans l'UI
- Simulation de notification WhatsApp agent
- Schema SQL Supabase avec `agency_id` et politiques RLS
- Tables `agency_subscriptions`, `onboarding_steps`, `integration_connections`
- Tables `profiles` et `followups`
- Fonction `testAgencyWebsiteSource(sourceUrl)` pour preparer le test de source site agence

## Prepare pour V2

- Connexion Supabase reelle aux pages
- Auth Supabase active et association `auth.users` -> `agency_users`
- WhatsApp Cloud API : webhooks, envoi, commandes agent
- Connexion WhatsApp accompagnee, puis automatisation Cloud API complete
- Crawling site agence, sitemap, flux XML/API et detection de changements
- OAuth Gmail, Outlook et Google Calendar
- Execution automatique des matches apres creation/mise a jour contact ou bien
- Envoi WhatsApp reel apres votre validation
- Configurer les produits/prix Stripe en production, puis renseigner `STRIPE_PRICE_ID_ASSISTANT_99`
- Configurer le webhook Stripe vers `/api/stripe/webhook`

## Base de donnees

Le schema est dans `supabase/schema.sql`.
Les donnees de demo SQL sont dans `supabase/seed.sql`.

Appliquer dans Supabase :

```bash
supabase db push
supabase db reset
```

ou copier le SQL dans l'editeur SQL Supabase pour un premier test.
