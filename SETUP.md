# EdgeLeak — Setup Guide (v4.2)

Site **prêt en production** avec : 3 plans Stripe, auth Supabase, onboarding 4 étapes, settings i18n FR/EN, suppression compte RGPD, pages légales.

---

## 🟢 État du projet

- ✅ **Landing** (`index.html`) — thème vert felt, 3 tiers
- ✅ **Onboarding** (`onboarding.html`) — 4 étapes split-screen
- ✅ **App** (`app.html`) — green theme, Settings 5 sections, language toggle, password reset, delete account
- ✅ **Pages légales** : `terms.html`, `privacy.html`, `compliance.html`, `404.html`
- ✅ **Stripe** : 2 produits Live (Hobbyist 3,99€/mo + Regular 9,99€/mo) avec TVA auto-calculée
- ✅ **Bibliothèque** : 46+ ranges GTO MTT
- ✅ **API** : `/api/checkout`, `/api/billing-portal`, `/api/webhook`, `/api/delete-account`

---

## ⚠️ Migration de la DB Supabase (à faire UNE FOIS)

Si tu as déjà la table `profiles` v1, il faut ajouter les nouvelles colonnes pour les 3 tiers + onboarding + langue. Va dans Supabase → **SQL Editor** → **New query**, colle ça :

```sql
-- Plan tiering
alter table public.profiles add column if not exists plan_type text default 'free' check (plan_type in ('free','hobbyist','regular'));

-- Onboarding fields
alter table public.profiles add column if not exists language text default 'fr';
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists formats text[] default '{}';
alter table public.profiles add column if not exists stakes text;
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists weekly_review boolean default true;
alter table public.profiles add column if not exists product_updates boolean default true;

-- Backfill plan_type from old is_pro flag
update public.profiles set plan_type = 'regular' where is_pro = true and (plan_type is null or plan_type = 'free');
```

Si c'est ta **première installation** (pas de table existante), utilise plutôt le SQL complet :

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  plan_type text default 'free' check (plan_type in ('free','hobbyist','regular')),
  is_pro boolean default false,
  language text default 'fr',
  country text,
  formats text[] default '{}',
  stakes text,
  goal text,
  weekly_review boolean default true,
  product_updates boolean default true,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_started_at timestamptz,
  plan_ended_at timestamptz,
  created_at timestamptz default now()
);

create table public.saved_ranges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.saved_ranges enable row level security;

create policy "users read own profile"   on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "users read own ranges"    on saved_ranges for select using (auth.uid() = user_id);
create policy "users insert own ranges"  on saved_ranges for insert with check (auth.uid() = user_id);
create policy "users delete own ranges"  on saved_ranges for delete using (auth.uid() = user_id);
```

---

## 💳 Stripe — TVA automatique (recommandé)

Le checkout est configuré pour `automatic_tax[enabled]=true`. Pour que ça marche en production :

1. Stripe Dashboard → **Tax** (menu gauche)
2. Active **Stripe Tax** pour ton compte
3. Renseigne ton adresse de société (Paris, France)
4. Active la TVA pour les pays UE (cocher l'Europe en bloc)
5. Stripe collectera automatiquement la TVA française 20% pour les particuliers FR, et la TVA du pays acheteur pour les autres pays UE

Si tu ne veux pas activer Stripe Tax tout de suite (et garder le prix HT), retire cette ligne dans `api/checkout.js` :
```js
params.append('automatic_tax[enabled]', 'true');
```

---

## 🌐 Variables d'environnement Vercel (rappel)

Toutes ces variables doivent être set dans Vercel → Settings → Environment Variables (Production) :

| Nom | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `APP_URL` | `https://www.edgeleak.com` |
| `SUPABASE_URL` | `https://uqeqbjkgfsmqjakuotfy.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` (⚠️ ne JAMAIS commit) |

Pas besoin de mettre `STRIPE_PRICE_ID` — l'API utilise désormais le price ID envoyé par le client (avec whitelist server-side).

---

## 🧪 Tests à faire après push

1. **Landing FR/EN** : ouvrir `/`, cliquer le toggle FR↔EN en haut à droite, vérifier que les textes se traduisent.
2. **Onboarding** : `/onboarding.html` → 4 étapes, créer un compte test, vérifier que le profil est créé avec `formats`, `stakes`, `goal`, `weekly_review`.
3. **Paiement Hobbyist** : depuis la landing, cliquer "Choisir Hobbyist → " → Stripe Checkout doit afficher 3,99€/mois → tester avec carte test (mode test) ou refunder en mode live.
4. **Paiement Regular** : pareil, doit afficher 9,99€/mois.
5. **Webhook** : après paiement, vérifier dans Supabase → `profiles` que `plan_type` = `hobbyist` ou `regular` et `is_pro` = `true`.
6. **Settings** : tester chaque section (Profile, Game, Billing, Data & privacy, Notifications) — sauvegarder un nom, changer la langue, exporter les données, etc.
7. **Suppression de compte** : dans Settings → Data & privacy → Delete forever → tape EFFACER → vérifier que le compte est supprimé de Supabase Auth.
8. **Pages légales** : visiter `/terms`, `/privacy`, `/compliance` — toutes doivent charger.
9. **404** : visiter `/blabla-page-inexistante` → page 404 custom.

---

## 📁 Architecture

```
edgeleak/
├── index.html              ← Landing v2 (thème vert, 3 tiers, i18n)
├── onboarding.html         ← Flow signup 4 étapes
├── app.html                ← Application (green theme, settings 5-section)
├── terms.html              ← CGU FR
├── privacy.html            ← Politique confidentialité RGPD
├── compliance.html         ← Conformité opérateurs poker
├── 404.html                ← Page 404 custom
├── config.js               ← Clés publiques + i18n FR/EN + plan capabilities
├── ranges.js               ← Bibliothèque GTO 46+ ranges
├── package.json            ← stripe dep
├── vercel.json             ← Routes + CORS
├── api/
│   ├── checkout.js         ← Stripe Checkout (price ID whitelist + TVA)
│   ├── billing-portal.js   ← Customer portal
│   ├── webhook.js          ← Sync 3 plans → Supabase
│   ├── delete-account.js   ← Suppression RGPD complète
│   └── claude.js           ← (legacy, plus utilisé)
└── SETUP.md                ← Ce fichier
```

---

## ✅ Ce qui est conforme RGPD / loi française

- Pas de cookies tracking (uniquement session Supabase)
- Suppression compte fonctionnelle (RGPD art. 17)
- Export données (RGPD art. 20)
- Conservation données minimale
- Hébergement EU (Supabase Paris)
- Mentions légales complètes
- TVA collectée automatiquement par Stripe pour vente UE
- Politique de confidentialité accessible en bas de chaque page

## ❌ Ce qui reste à faire pour une vraie commercialisation

- Faire valider les CGU/Privacy par un avocat (les templates sont du démarrage MVP)
- Activer Stripe Tax dans le dashboard Stripe
- Configurer SMTP (Resend, Postmark) pour les emails de confirmation Supabase
- Réactiver email confirmation dans Supabase une fois SMTP set
- Ajouter analytics privacy-friendly (Plausible recommandé)
- Étoffer la bibliothèque (200+ ranges pour vraiment justifier le prix)
- Enregistrer EdgeLeak SAS au RCS si tu veux vraiment commercialiser
