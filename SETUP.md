# EdgeLeak — Setup Guide

Le site marche en **mode démo** dès maintenant (auth/sauvegarde via `localStorage`). Pour passer en **production réelle** (vrais comptes, vrais paiements, vraie base de données), suis les 3 étapes ci-dessous.

Compte à passer : ~30 minutes au total. Aucune ligne de commande nécessaire.

---

## 🟢 État actuel — Ce qui marche déjà

- ✅ Landing page (`index.html`) — refondue, focus 100 % GTO ranges
- ✅ App (`app.html`) — explorer, builder, saved ranges, settings
- ✅ Bibliothèque GTO (`ranges.js`) — 30+ ranges pré-chargées (UTG → BB, 100/40/20bb, RFI / vs open / vs 3-bet)
- ✅ Compte Stripe connecté · produit "EdgeLeak Pro" à 9,99€/mois existe (`price_1TRg2nLqC6EEycUgd0TXBiua`)
- ✅ Endpoints API : `/api/checkout`, `/api/billing-portal`, `/api/webhook` (Stripe)
- ⚠️  Mode démo actif tant que Supabase n'est pas configuré (auth + saves dans le navigateur uniquement)

---

## 1️⃣  Créer ton projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **Start your project** → connecte-toi avec GitHub.
2. **New project** :
   - Name : `edgeleak`
   - Password : génère-en un fort, garde-le quelque part
   - Region : `Europe (Paris) — eu-west-3`
   - Plan : **Free** (largement suffisant pour démarrer)
3. Attends ~2 min que le projet soit provisionné.

### Récupérer tes clés

Dans Supabase → **Project Settings (icône engrenage en bas) → API** :
- **Project URL** → ressemble à `https://xxxxxxxxxx.supabase.co`
- **anon public key** → commence par `eyJ...` (publique, safe à exposer)
- **service_role key** → commence par `eyJ...` (**SECRÈTE — jamais dans le code public**)

### Coller dans `config.js`

Édite `config.js` à la racine du projet et remplace les placeholders :

```js
window.SUPABASE_URL = 'https://xxxxxxxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbG...ton_anon_key';
window.STRIPE_PRICE_ID = 'price_1TRg2nLqC6EEycUgd0TXBiua';
```

Commit et push via GitHub Desktop.

### Créer les tables

Dans Supabase → **SQL Editor → New query**, colle ce SQL et clique **Run** :

```sql
-- Profiles : 1 ligne par utilisateur, créée à l'inscription
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_pro boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_started_at timestamptz,
  plan_ended_at timestamptz,
  created_at timestamptz default now()
);

-- Ranges sauvegardées par l'utilisateur
create table public.saved_ranges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Sécurité : chaque utilisateur ne voit que ses données
alter table public.profiles enable row level security;
alter table public.saved_ranges enable row level security;

create policy "users read own profile"   on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "users read own ranges"    on saved_ranges for select using (auth.uid() = user_id);
create policy "users insert own ranges"  on saved_ranges for insert with check (auth.uid() = user_id);
create policy "users delete own ranges"  on saved_ranges for delete using (auth.uid() = user_id);
```

### Désactiver la confirmation email (optionnel pour MVP)

Pour que les inscriptions fonctionnent immédiatement sans envoyer de mail :
- **Authentication → Providers → Email**
- Décoche **Confirm email**
- Save

(Tu peux la réactiver plus tard, après avoir configuré un service SMTP.)

---

## 2️⃣  Configurer les variables d'environnement Vercel

Dans Vercel → ton projet `edgeleak` → **Settings → Environment Variables** → ajoute pour **Production** :

| Nom | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (Stripe Dashboard → Developers → API keys → Secret key) |
| `STRIPE_PRICE_ID` | `price_1TRg2nLqC6EEycUgd0TXBiua` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (créé à l'étape 3 ci-dessous) |
| `APP_URL` | `https://edgeleak.app` (ou ton URL Vercel) |
| `SUPABASE_URL` | ton URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ta service_role key Supabase |

⚠️ **Ne mets jamais** `SUPABASE_SERVICE_ROLE_KEY` ou `STRIPE_SECRET_KEY` dans `config.js` ou tout fichier commité — ce sont des clés serveur, elles ne vivent QUE dans Vercel.

Clique **Save**. Vercel va automatiquement redéployer.

---

## 3️⃣  Configurer le Webhook Stripe

Le webhook permet à Stripe de notifier ton site quand un paiement réussit, pour activer le plan Regular dans Supabase.

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL** : `https://edgeleak.app/api/webhook` (ton domaine + `/api/webhook`)
3. **Events to send** : sélectionne ces 3 :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Clique **Add endpoint**
5. Sur la page de l'endpoint créé, **Signing secret → Reveal** → copie la valeur (`whsec_...`)
6. Retourne dans Vercel et colle cette valeur dans `STRIPE_WEBHOOK_SECRET` (étape 2)
7. Vercel redéploie

---

## 4️⃣  Tester

1. Va sur `https://edgeleak.app/`
2. Clique **Start free** → crée un compte test avec ton email
3. Vérifie dans Supabase → **Table Editor → profiles** : ta ligne doit apparaître avec `is_pro = false`
4. Sur `/app.html` clique **Upgrade · 9,99€/mo** → tu es redirigé vers Stripe Checkout
5. Utilise une carte de test Stripe : `4242 4242 4242 4242` · n'importe quelle date future · n'importe quel CVC
6. Après paiement, retour sur `/app.html?checkout=success` → tu vois le toast "Welcome to Regular"
7. Vérifie dans Supabase → `profiles` : ta ligne doit maintenant avoir `is_pro = true` (mis à jour par le webhook)
8. Toutes les positions et stack depths sont débloquées dans l'explorer ✅

---

## 📁 Architecture des fichiers

```
edgeleak/
├── index.html          ← Landing page
├── app.html            ← Application (auth + range explorer + saved + settings)
├── config.js           ← Clés publiques Supabase + Stripe price ID  (PUBLIC)
├── ranges.js           ← Bibliothèque GTO (~30+ ranges) + tips coach
├── package.json        ← Dépendance: stripe (pour le webhook)
├── vercel.json         ← Config Vercel
├── api/
│   ├── checkout.js         ← Crée une session Stripe Checkout
│   ├── billing-portal.js   ← Ouvre le Customer Portal Stripe
│   ├── webhook.js          ← Reçoit les events Stripe → update Supabase
│   └── claude.js           ← (legacy, plus utilisé — peut être supprimé)
└── SETUP.md            ← Ce fichier
```

---

## 🚨 Si quelque chose ne marche pas

| Symptôme | Diagnostic |
|---|---|
| Inscription dit "Demo mode: …" | `config.js` a encore les placeholders → étape 1 |
| Bouton Upgrade redirige vers buy.stripe.com (pas vers Checkout custom) | `STRIPE_SECRET_KEY` manquant côté Vercel → étape 2 |
| Paiement réussi mais `is_pro` reste à `false` | Webhook pas configuré → étape 3. Vérifie l'onglet **Webhooks** de Stripe pour voir les delivery attempts |
| `/api/webhook` retourne 400 "signature failed" | `STRIPE_WEBHOOK_SECRET` ne correspond pas — recopie-le depuis Stripe |
| RLS errors dans la console | Le SQL des policies n'a pas été exécuté → étape 1 |

---

## 🎯 Roadmap future (non bloquant pour le MVP)

- [ ] Ajouter plus de ranges (Cash 6-max, vs 3-bet pour toutes positions, 4-bet pots)
- [ ] Mode quiz (l'app te montre une main, tu réponds raise/call/fold)
- [ ] Export PNG des ranges
- [ ] Page `/about`, `/terms`, `/privacy` (obligatoire pour Stripe en prod)
- [ ] SMTP via Resend pour les emails de confirmation
- [ ] Domaine custom + DNS (si pas déjà fait)
- [ ] Analytics (Plausible / Umami — sans cookies)

---

Si tu bloques sur une étape, reviens dans le chat et dis-moi où ça coince. Je te guide ou je débogue avec toi.
