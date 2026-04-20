# DEVMAP — Clévia Conciergerie Website
> Cartographie complète du développement du site cleviamaroc.com  
> Dernière mise à jour : avril 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Base de données Supabase](#3-base-de-données-supabase)
4. [Architecture des fichiers](#4-architecture-des-fichiers)
5. [Pages publiques](#5-pages-publiques)
6. [Panel admin](#6-panel-admin)
7. [Composants](#7-composants)
8. [Librairies utilitaires](#8-librairies-utilitaires)
9. [Internationalisation](#9-internationalisation)
10. [SEO](#10-seo)
11. [Historique des features](#11-historique-des-features)
12. [Migrations SQL à appliquer](#12-migrations-sql-à-appliquer)
13. [Déploiement](#13-déploiement)

---

## 1. Vue d'ensemble

**Clévia Conciergerie** est une société de gestion de locations courte durée basée à Mansouria-Mohammedia, Maroc. Elle gère des biens pour le compte de propriétaires et les distribue sur Airbnb, Booking.com et Avito.ma.

Le site a deux objectifs :
- **Côté propriétaires** : générer des leads de propriétaires souhaitant confier leur bien
- **Côté voyageurs** : afficher les biens disponibles à la location (et à la vente)

**URLs**
| Env | URL |
|---|---|
| Production | https://www.cleviamaroc.com |
| Backup Vercel | https://clevia-website.vercel.app |
| Admin | https://www.cleviamaroc.com/fr/admin |
| GitHub | https://github.com/iMouad/clevia-website |

---

## 2. Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 14 (App Router) | Framework principal, SSR + RSC |
| TypeScript | 5 | Typage statique |
| Tailwind CSS | 4 | Styles (config CSS-based, pas tailwind.config.js) |
| Supabase | — | PostgreSQL + Auth + Storage |
| next-intl | — | i18n FR / AR / EN |
| Framer Motion | — | Animations (`AnimateIn`) |
| Vercel | — | Déploiement, CI/CD automatique |

**Polices Google Fonts**
- Titres : `Cormorant Garamond` (weight 400, italic)
- Corps / UI : `DM Sans` (weight 300, 400, 500)

**Palette de couleurs (CSS variables)**
```css
--brun:       #2C1A0E   /* fond sombre, textes */
--terra:      #C97B4B   /* accent principal */
--sable:      #E8A87C   /* accent secondaire */
--corail:     #F0997B   /* accent tertiaire */
--creme:      #FAF6F1   /* fond clair */
--brun-mid:   #6B4C35   /* textes secondaires */
--brun-light: #A07850   /* détails */
```

---

## 3. Base de données Supabase

### Tables

#### `biens` — Biens à louer
```sql
id            uuid PK DEFAULT gen_random_uuid()
nom           text NOT NULL
ville         text
adresse       text
latitude      numeric          -- coordonnées GPS (ajout récent)
longitude     numeric          -- coordonnées GPS (ajout récent)
slug          text UNIQUE      -- URL SEO (ajout récent)
type          text             -- Appartement / Villa / Studio / Autre
capacite      int
capacite_max  int
chambres      int
salles_de_bain int
surface       int
etage         text
equipements   text[]
regles        text[]
distance_mer  text
disponible    boolean DEFAULT true
prix_nuit     decimal
description   text
statut        text             -- actif / en_attente / inactif
photos        text[]           -- URLs Supabase Storage
airbnb_url    text
booking_url   text
avito_url     text
video_url     text             -- lien Google Drive
created_at    timestamptz DEFAULT now()
updated_at    timestamptz
```

**RLS** : lecture publique si `statut = 'actif'`, full access si authentifié

#### `biens_vente` — Biens à vendre
```sql
id            uuid PK DEFAULT gen_random_uuid()
titre         text NOT NULL
categorie     text             -- Appartement / Studio / Villa / Terrain / Ferme / Commercial
sous_type     text             -- Terrain agricole / Lot villa / Lot ferme / Lot habitation
statut        text             -- a_vendre / sous_compromis / vendu
slug          text UNIQUE      -- URL SEO (ajout récent)
prix          decimal
surface       decimal          -- en m² (ou ha si Terrain)
chambres      int
salles_de_bain int
etage         int
ville         text NOT NULL
adresse       text
latitude      numeric
longitude     numeric
description   text
equipements   text[]
photos        text[]           -- URLs Supabase Storage
telephone     text NOT NULL
reference     text             -- ex: CLV-V-001
video_url     text
created_at    timestamptz DEFAULT now()
updated_at    timestamptz
```

**RLS** : lecture publique pour `a_vendre` + `sous_compromis`, full access authentifié

#### `reservations`
```sql
id               uuid PK
bien_id          uuid FK→biens
voyageur_nom     text
voyageur_email   text
voyageur_phone   text
date_arrivee     date
date_depart      date
plateforme       text    -- Airbnb / Booking / Avito / Direct
montant          decimal
taux_commission  decimal DEFAULT 20.00
statut           text    -- confirmee / annulee / terminee
notes            text
created_at       timestamptz
```

#### `contacts`
```sql
id          uuid PK
nom         text
email       text
telephone   text
ville_bien  text
type_bien   text
message     text
traite      boolean DEFAULT false
created_at  timestamptz
```

Utilisé pour : formulaire de contact, formulaire de visite (biens à vendre), formulaire lead homepage (simulateur).

#### `settings`
```sql
key         text PK
value_fr    text
value_ar    text
value_en    text
updated_at  timestamptz
```

#### `temoignages`
```sql
id          uuid PK
nom         text
ville       text
texte       text
note        int    -- 1-5
actif       boolean DEFAULT false
created_at  timestamptz
```

#### `vente_visites` — Tracking analytics biens à vendre
```sql
id          uuid PK
bien_id     uuid FK→biens_vente
source      text    -- référant HTTP
utm_source  text
appareil    text    -- mobile / desktop / tablet
created_at  timestamptz
```

### Storage Buckets

| Bucket | Usage | Accès |
|---|---|---|
| `biens-photos` | Photos biens à louer | Public |
| `vente-photos` | Photos biens à vendre | Public |

---

## 4. Architecture des fichiers

```
clevia-website/
│
├── app/
│   ├── layout.tsx                        # Root layout (fonts, metadata globale)
│   ├── page.tsx                          # Redirect vers /fr
│   │
│   ├── [locale]/                         # Routing i18n (fr / ar / en)
│   │   ├── layout.tsx                    # Layout global + Navbar + Footer + WhatsApp btn
│   │   ├── page.tsx                      # Page d'accueil
│   │   │
│   │   ├── services/page.tsx             # 6 services + tarification
│   │   ├── comment/page.tsx              # Process en 6 étapes
│   │   ├── pourquoi/page.tsx             # 4 arguments + chiffres clés
│   │   ├── contact/page.tsx              # Formulaire → Supabase contacts
│   │   ├── simulateur/page.tsx           # Simulateur de revenus locatifs
│   │   │
│   │   ├── biens/
│   │   │   ├── page.tsx                  # Grille biens à louer (filtres type + ville)
│   │   │   └── [id]/page.tsx             # Détail bien (UUID ou slug)
│   │   │
│   │   ├── vente/
│   │   │   ├── page.tsx                  # Grille biens à vendre (filtres multiples)
│   │   │   └── [id]/page.tsx             # Détail bien à vendre (UUID ou slug)
│   │   │
│   │   ├── mohammedia/page.tsx           # Page SEO locale Mohammedia
│   │   ├── mansouria/page.tsx            # Page SEO locale Mansouria
│   │   ├── bouznika/page.tsx             # Page SEO locale Bouznika
│   │   └── benslimane/page.tsx           # Page SEO locale Benslimane
│   │
│   ├── admin/
│   │   ├── layout.tsx                    # Layout admin (sans i18n)
│   │   ├── login/page.tsx                # Auth Supabase
│   │   └── (authenticated)/              # Route group protégé par middleware
│   │       ├── layout.tsx                # Sidebar + topbar admin
│   │       ├── page.tsx                  # Dashboard avec stats globales
│   │       ├── biens/page.tsx            # CRUD biens à louer + upload photos
│   │       ├── vente/page.tsx            # CRUD biens à vendre + tracking
│   │       ├── reservations/page.tsx     # CRUD réservations + calculs commission
│   │       ├── contacts/page.tsx         # Leads entrants + marquage traité
│   │       ├── calendrier/page.tsx       # Calendrier admin multi-biens
│   │       ├── temoignages/page.tsx      # Modération témoignages
│   │       └── settings/page.tsx         # Textes éditables FR/AR/EN
│   │
│   └── calendrier/                       # Calendrier public propriétaire (sans auth)
│       ├── layout.tsx
│       ├── page.tsx                      # Vue générale
│       └── [token]/page.tsx              # Vue par token propriétaire
│
├── components/
│   ├── Navbar.tsx                        # Navigation responsive + drawer mobile
│   ├── Footer.tsx                        # Footer 5 colonnes + liens villes SEO
│   ├── WhatsAppButton.tsx                # Bouton flottant WhatsApp
│   ├── ContactForm.tsx                   # Formulaire de contact client
│   ├── RevenueCalculator.tsx             # Simulateur de revenus (client)
│   ├── TemoignagesSection.tsx            # Carrousel témoignages
│   │
│   ├── BienCard.tsx                      # Carte bien à louer (type BienPublic)
│   ├── BienVenteCard.tsx                 # Carte bien à vendre (type BienVente)
│   ├── BiensGrid.tsx                     # Grille avec filtres type + ville
│   ├── CityLandingPage.tsx               # Page SEO locale réutilisable (4 villes)
│   ├── HomeBiensSection.tsx              # Section biens à louer homepage
│   ├── HomeBiensVenteSection.tsx         # Mention one-liner biens à vendre homepage
│   │
│   ├── admin/
│   │   └── AdminSidebar.tsx              # Sidebar + topbar responsive admin
│   │
│   ├── biens/
│   │   └── BienGallery.tsx               # Galerie photos avec swipe (client)
│   │
│   ├── vente/
│   │   ├── VenteGrid.tsx                 # Grille avec filtres catégorie/budget/ville/équip.
│   │   ├── VenteTracker.tsx              # Tracking visite silencieux (client)
│   │   └── DemandeVisiteForm.tsx         # Formulaire demande de visite (client)
│   │
│   └── ui/
│       └── AnimateIn.tsx                 # Wrapper Framer Motion fade-in
│
├── lib/
│   ├── supabase.ts                       # Client Supabase navigateur
│   ├── supabase/
│   │   ├── client.ts                     # createBrowserClient
│   │   └── server.ts                     # createServerClient (cookies)
│   ├── equipements.ts                    # Référentiel équipements biens à louer
│   ├── equipements-vente.ts              # Référentiel équipements par catégorie (vente)
│   └── slugify.ts                        # Génération slugs SEO (location + vente)
│
├── messages/
│   ├── fr.json                           # Traductions françaises
│   ├── ar.json                           # Traductions arabes
│   └── en.json                           # Traductions anglaises
│
├── public/
│   ├── logo.svg                          # Logo complet fond clair
│   ├── logo-light.svg                    # Logo fond sombre (footer, admin)
│   ├── icon.svg                          # Icône seule
│   └── favicon.svg                       # Favicon
│
├── middleware.ts                         # Protection /admin/* + routing i18n
├── CLAUDE.md                             # Instructions projet pour Claude Code
└── DEVMAP.md                             # Ce fichier
```

---

## 5. Pages publiques

### `/ → /fr` (Homepage)
**Fichier** : `app/[locale]/page.tsx`

Sections dans l'ordre :
1. **Hero** — titre Cormorant + sous-titre + 2 CTA (Confier mon bien / Simuler mes revenus)
2. **Stats** — 3 chiffres clés (15+ nuits/mois, 48h mise en ligne, 7j/7)
3. **Services résumé** — 3 cartes services + lien vers /services
4. **Comment ça marche** — 4 étapes simplifiées + lien vers /comment
5. **Simulateur** (`RevenueCalculator`) — estimation revenus + formulaire lead
6. **Biens à louer** (`HomeBiensSection`) — 3 biens Supabase + lien /biens
7. **Biens à vendre** (`HomeBiensVenteSection`) — mention one-liner minimaliste
8. **Témoignages** (`TemoignagesSection`) — depuis Supabase, triés actif=true
9. **CTA dark** — "Vous avez un bien ?" + bouton contact

**Données** : Server Component, fetch Supabase côté serveur (biens actifs limit 3, témoignages actifs)

---

### `/biens` — Biens à louer
**Fichier** : `app/[locale]/biens/page.tsx`  
**Composant** : `components/BiensGrid.tsx`

- Fetch depuis `biens` WHERE `statut = 'actif'`
- Filtre **type** (Tous / Appartement / Villa / Studio)
- Filtre **ville** (Mohammedia / Mansouria / Bouznika / Benslimane) — affiché uniquement si >1 ville dans les données
- Cards `BienCard` → lien `/biens/{slug ?? id}`
- Lazy load, scroll smooth

---

### `/biens/[id]` — Détail bien à louer
**Fichier** : `app/[locale]/biens/[id]/page.tsx`

- Détecte UUID vs slug : `const isUUID = /^[0-9a-f]{8}-...$/.test(id)`
- Query : `.eq(isUUID ? 'id' : 'slug', id)`
- Galerie photos (`BienGallery`) — swipe mobile, navigation arrows
- Badges équipements
- Prix / nuit, capacité, surface, chambres, salle de bain, distance mer
- Boutons Airbnb / Booking / Avito (si renseignés)
- Vidéo Google Drive (si renseignée)
- Section "Autres biens" (3 biens de la même ville)
- Métadonnées SEO dynamiques (title, description, og:image)
- Sitemap dynamique (`app/sitemap.ts`)

---

### `/vente` — Biens à vendre
**Fichier** : `app/[locale]/vente/page.tsx`  
**Composant** : `components/vente/VenteGrid.tsx`

- Fetch depuis `biens_vente` WHERE `statut IN ('a_vendre', 'sous_compromis')`
- **4 niveaux de filtres** :
  1. Catégorie (Tous / Appartement / Studio / Villa / Terrain / Ferme / Commercial)
  2. Budget (Tous / <500k / 500k–1M / 1M–3M / +3M MAD)
  3. Ville (Mohammedia / Mansouria / Bouznika / Benslimane / Rabat / Casablanca / Autres villes)
  4. Équipements (panel expandable, multi-select, labels locale-aware)
- Toggle "Afficher aussi les vendus"
- Compteur résultats actif + bouton reset filtres
- Cards `BienVenteCard` → lien `/vente/{slug ?? id}`

---

### `/vente/[id]` — Détail bien à vendre
**Fichier** : `app/[locale]/vente/[id]/page.tsx`

- UUID ou slug — même pattern que `/biens/[id]`
- Tracking visite silencieux (`VenteTracker`) → insert dans `vente_visites`
- Galerie photos (swipe mobile)
- Badge statut (À vendre / Sous compromis / Vendu)
- Badge sous_type si Terrain (Terrain agricole / Lot villa / etc.)
- Surface en ha si `categorie === 'Terrain'`, sinon m²
- Sticky sidebar desktop : prix + téléphone + lien WhatsApp + **formulaire demande de visite** (`DemandeVisiteForm`)
- Section "Autres biens à vendre" (même ville, max 3)
- Métadonnées SEO dynamiques

---

### `/simulateur` — Simulateur de revenus
**Fichier** : `app/[locale]/simulateur/page.tsx`  
**Composant** : `components/RevenueCalculator.tsx`

- Type de bien (Appartement / Villa / Studio)
- Nombre de chambres (1 / 2 / 3 / 4+)
- Options : piscine, vue mer, parking
- Calcul estimation revenus nets / mois (basé sur données marché local)
- Formulaire lead : nom + téléphone + email → insert `contacts`
- Page dédiée (partage réseaux sociaux, SEO)

---

### `/contact`
**Fichier** : `app/[locale]/contact/page.tsx`

- Formulaire : nom, email, téléphone, ville bien, type bien, message
- Insert dans `contacts`
- Confirmation affichée inline

---

### Pages SEO locales (4 villes)

**Composant partagé** : `components/CityLandingPage.tsx`  
**Config** : `CITY_CONFIGS` (exporté depuis le composant)

| Page | Fichier | URL |
|---|---|---|
| Mohammedia | `app/[locale]/mohammedia/page.tsx` | `/fr/mohammedia` |
| Mansouria | `app/[locale]/mansouria/page.tsx` | `/fr/mansouria` |
| Bouznika | `app/[locale]/bouznika/page.tsx` | `/fr/bouznika` |
| Benslimane | `app/[locale]/benslimane/page.tsx` | `/fr/benslimane` |

Structure de chaque page :
1. **Hero** — "Conciergerie à {ville}" + tagline + description + CTA (Contact + WhatsApp)
2. **Stats bar** — 4 chiffres (+15 nuits/mois, 48h, 7/7, 100% clé en main)
3. **Biens à louer** — grid filtré par ville (`.ilike('ville', '%{name}%')`, max 6)
4. **Biens à vendre** — grid filtré par ville (max 3)
5. **CTA dark** — "Vous avez un bien à {ville} ?"

Chaque page a ses propres métadonnées SEO (`title`, `description`, `keywords`, `canonical`, `og:*`)

---

### Calendrier propriétaire

**Fichier** : `app/calendrier/[token]/page.tsx`

- Vue calendrier des disponibilités d'un bien
- Accessible via un lien unique avec token (sans auth Supabase)
- Généré depuis l'admin calendrier
- Côté propriétaire : vue lecture seule de ses réservations

---

## 6. Panel admin

**Route** : `/admin` (sans préfixe locale — pas d'i18n dans l'admin)  
**Protection** : `middleware.ts` redirige vers `/admin/login` si pas de session Supabase  
**Layout** : `app/admin/(authenticated)/layout.tsx` + `AdminSidebar.tsx`

### Admin Dashboard — `/admin`
- Revenus du mois en cours
- Commission Clévia du mois
- Nombre de réservations actives
- Taux d'occupation global
- Graphique réservations par plateforme (Airbnb / Booking / Avito / Direct)
- Nouveaux contacts non traités

### Admin Biens — `/admin/biens`
**Fichier** : `app/admin/(authenticated)/biens/page.tsx`

Features :
- **Table desktop** / **cartes mobile** (responsive)
- **Ajouter / Modifier / Supprimer** bien
- Upload photos (drag & drop ou click) → Supabase Storage `biens-photos`
- Sélection photo principale (mise à l'avant)
- Équipements (checkboxes, `lib/equipements.ts`)
- Règles de la maison
- Champs GPS (latitude / longitude)
- Liens Airbnb / Booking / Avito
- Lien vidéo Google Drive
- Toggle disponibilité
- **Bouton "Générer les slugs SEO"** → génère en batch les slugs manquants

### Admin Vente — `/admin/vente`
**Fichier** : `app/admin/(authenticated)/vente/page.tsx`

Features :
- Table desktop + cartes mobile
- CRUD complet biens à vendre
- Catégories + sous-type terrain (Terrain agricole / Lotissement → Lot villa / Lot ferme / Lot habitation)
- Surface en ha si Terrain, m² sinon
- Statuts (À vendre / Sous compromis / Vendu)
- Prix sur demande toggle
- Upload photos → `vente-photos`
- GPS (latitude / longitude)
- **Tracking analytics** : nombre de vues par bien (cliquable → panel inline)
- Panel stats par bien : visites 7 derniers jours (mini bar chart), sources, appareils
- Stats globales : biens actifs, total visites, bien le plus consulté, biens vendus
- **Bouton "Générer les slugs SEO"** → génère en batch les slugs manquants

### Admin Réservations — `/admin/reservations`
- CRUD réservations
- Calcul automatique : revenus, commission Clévia, nombre de nuits
- Filtres par bien, plateforme, statut
- Vue mensuelle

### Admin Contacts — `/admin/contacts`
- Liste des leads entrants (formulaire contact + formulaire visite + lead simulator)
- Marquage traité / non traité
- Filtre non traités

### Admin Calendrier — `/admin/calendrier`
- Vue calendrier multi-biens
- Génération lien propriétaire (token unique)

### Admin Témoignages — `/admin/temoignages`
- CRUD témoignages
- Toggle actif/inactif (contrôle l'affichage public)
- Note 1-5 étoiles

### Admin Settings — `/admin/settings`
- Textes éditables en FR / AR / EN (depuis table `settings`)
- Sauvegarde par clé

---

## 7. Composants

### `BienCard.tsx`
Type `BienPublic` — carte bien à louer pour les grilles.  
URL : `/biens/{slug ?? id}`  
Affiche : photo principale, nom, ville, type, capacité, prix/nuit, badges équipements.

### `BienVenteCard.tsx`
Type `BienVente` — carte bien à vendre.  
URL : `/vente/{slug ?? id}`  
Affiche : photo, titre, catégorie, statut badge, prix (ou "Prix sur demande"), surface, chambres, ville.

### `BiensGrid.tsx`
Client Component — grille filtrée des biens à louer.  
- Filtre type (pills)
- Filtre ville (pills, conditionnel si >1 ville)
- State local, pas de routing URL

### `CityLandingPage.tsx`
Server Component — page SEO locale générique.  
Exporte `CITY_CONFIGS` (Mohammedia / Mansouria / Bouznika / Benslimane).  
Chaque config : `{ name, tagline, description, color }`.

### `VenteGrid.tsx`
Client Component — grille filtrée des biens à vendre.  
4 rangées de filtres : catégorie → budget → ville → équipements.  
Active filter count + reset.

### `VenteTracker.tsx`
Client Component invisible — détecte appareil + source au chargement et insère dans `vente_visites`.

### `DemandeVisiteForm.tsx`
Client Component — formulaire de demande de visite sur les pages biens à vendre.  
Toggle ouverture, champs nom + téléphone + date souhaitée + message.  
Insert dans `contacts` avec message formaté incluant titre + référence du bien.

### `RevenueCalculator.tsx`
Client Component — simulateur de revenus.  
Calcul local (pas d'API), avec formulaire lead intégré.

### `BienGallery.tsx`
Client Component — galerie photos biens à louer.  
Swipe tactile mobile, navigation arrows desktop, compteur photos.

### `AnimateIn.tsx`
Wrapper Framer Motion — fade-in + slide-up au scroll (IntersectionObserver).

### `WhatsAppButton.tsx`
Bouton flottant en bas à droite, lien `wa.me/212614268283`.

### `TemoignagesSection.tsx`
Carrousel témoignages, données depuis Supabase (actif=true), étoiles.

### `AdminSidebar.tsx`
Layout admin responsive — topbar sur mobile (drawer hamburger), sidebar fixe sur desktop.

---

## 8. Librairies utilitaires

### `lib/slugify.ts`
```typescript
// Enlève les accents, passe en minuscule, remplace espaces par tirets
function slugify(text: string): string

// Slug biens à vendre : "{titre}-{ville}-{reference ou id.slice(0,8)}"
// Ex: "appartement-bouznika-vue-mer-clv-v-001"
function generateVenteSlug(titre, ville, reference, id): string

// Slug biens à louer : "{nom}-{ville}-{id.slice(0,8)}"
// Ex: "villa-mohammedia-corniche-7536da6f"
function generateLocationSlug(nom, ville, id): string
```

**Unicité garantie** : le suffixe ID (8 chars) rend chaque slug unique sans requête DB.

### `lib/equipements.ts`
Référentiel des équipements pour biens à louer.  
Chaque item : `{ key: string, label: { fr, ar, en } }`

### `lib/equipements-vente.ts`
Référentiel des équipements par catégorie de bien à vendre.  
Fonction `getEquipementsForCategorie(categorie)` → liste filtrée.  
Chaque item : `{ key, label: { fr, ar, en }, path (SVG) }`

Catégories couvertes : Appartement / Studio / Villa / Terrain / Ferme / Commercial  
Équipements inclus (liste partielle) : piscine, jacuzzi, hammam, suite parentale, dressing, vue piscine, piscine chauffée, parking, ascenseur, terrasse, jardin, vue mer…

### `lib/supabase.ts` + `lib/supabase/client.ts` + `lib/supabase/server.ts`
- `client.ts` → `createBrowserClient` (pour Client Components)
- `server.ts` → `createServerClient` avec cookies (pour Server Components + Route Handlers)
- `supabase.ts` → export legacy `createClient` pour l'admin (client component)

---

## 9. Internationalisation

**Locales** : `fr` (défaut), `ar`, `en`  
**Middleware** : redirige `/` → `/fr`, gère le préfixe locale sur toutes les routes

**Fichiers** :
- `messages/fr.json`
- `messages/ar.json`
- `messages/en.json`

**RTL** : `<html dir={locale === 'ar' ? 'rtl' : 'ltr'}>` dans `app/[locale]/layout.tsx`

**Namespaces utilisés** :
| Namespace | Contenu |
|---|---|
| `nav` | Liens de navigation |
| `hero` | Section héro homepage |
| `services` | Services page + résumé homepage |
| `comment` | Process 6 étapes |
| `pourquoi` | Arguments Clévia |
| `biens` | Page /biens + cards |
| `vente` | Page /vente + cards |
| `contact` | Formulaire + infos contact |
| `simulateur` | Simulateur revenus |
| `footer` | Footer textes |
| `calculator` | Labels calculateur |
| `temoignages` | Section témoignages |

**Règle absolue** : zéro texte hardcodé dans les composants. Tout passe par `useTranslations()` (client) ou `getTranslations()` (server).

---

## 10. SEO

### Métadonnées dynamiques
Chaque page de détail (biens + vente) génère via `generateMetadata()` :
- `title` : nom du bien + ville + "Clévia"
- `description` : description tronquée à 160 chars
- `og:image` : première photo du bien
- `og:url` : URL canonique

### Pages SEO locales
4 pages dédiées par ville avec :
- Title ciblé : "Conciergerie Airbnb à {ville} — Clévia"
- Keywords locaux (conciergerie + gestion location + Airbnb + ville)
- URL canonique
- Contenu unique par ville (biens filtrés)

### Sitemap
`app/sitemap.ts` — génère dynamiquement :
- Pages statiques (accueil, services, comment, pourquoi, contact, simulateur)
- Pages SEO villes
- Toutes les pages de détail des biens actifs
- Toutes les pages de détail des biens à vendre

### URLs SEO-friendly (slugs)
Format : `/{locale}/biens/{nom}-{ville}-{id.slice(0,8)}`  
Format : `/{locale}/vente/{titre}-{ville}-{reference ou id.slice(0,8)}`

Rétrocompatibilité : les anciennes URLs avec UUID continuent de fonctionner.

### Footer — liens internes villes
Le footer contient une colonne "Nos villes" avec liens vers les 4 pages SEO locales → boost netlinking interne.

---

## 11. Historique des features

| # | Feature | Commit(s) |
|---|---|---|
| 1 | Init projet + identité graphique | `b363a4c` |
| 2 | Page `/biens` publique + carousel photos | `62bfd87` |
| 3 | Calculateur de revenus + témoignages | `76e41b3` |
| 4 | Admin complet (biens / réservations / contacts / settings) | — |
| 5 | Page `/simulateur` dédiée | `520d27b` |
| 6 | Bouton WhatsApp flottant + lead form simulateur | `77a712b` |
| 7 | Feature 1 — Pages biens style Airbnb (galerie, équipements, détail) | `7cce282` |
| 8 | Feature 2 — Calendrier disponibilités + lien propriétaire | `4060903` |
| 9 | Sitemap dynamique + JSON-LD + filtres /biens | `0d04a4d` |
| 10 | Section biens à vendre (liste, détail, admin, tracking visites) | `879ef53` |
| 11 | Admin mobile-first (topbar + drawer) | `30101ed` |
| 12 | Photo carousel swipe + vidéo Google Drive | `8e490e0` |
| 13 | Nouveaux équipements vente (suite parentale, jacuzzi, hammam…) | `56eda29` |
| 14 | GPS (lat/lng) sur biens à louer + admin | `56eda29` |
| 15 | Sous-type Terrain (agricole / lotissement → lots) | `56eda29` |
| 16 | Filtres prix + équipements sur /vente | `4f219c8` |
| 17 | Expansion 4 villes (Bouznika + Benslimane dans tous les textes) | `e57e565` |
| 18 | Filtre ville sur /biens + /vente | `e57e565` |
| 19 | Homepage section vente → one-liner minimaliste | `130a8ed` |
| 20 | SEO slugs (génération + routing UUID-ou-slug) | `c51d3cc` |
| 21 | Formulaire de visite sur pages biens à vendre | `c51d3cc` |
| 22 | Pages SEO locales (Mohammedia / Mansouria / Bouznika / Benslimane) | `c51d3cc` |
| 23 | Footer colonne "Nos villes" | `c51d3cc` |
| 24 | Bouton "Générer tous les slugs" dans admin biens + vente | `00a2b22` |

---

## 12. Migrations SQL

Toutes les migrations ont été appliquées en production. ✅

| Colonne | Table | Type | Statut |
|---|---|---|---|
| `slug` | `biens` | `text UNIQUE` | ✅ Appliqué |
| `slug` | `biens_vente` | `text UNIQUE` | ✅ Appliqué |
| `latitude` | `biens` | `numeric` | ✅ Appliqué |
| `longitude` | `biens` | `numeric` | ✅ Appliqué |
| `sous_type` | `biens_vente` | `text` | ✅ Appliqué |

Les slugs des biens existants ont été générés via le bouton "Générer les slugs SEO" disponible dans `/admin/biens` et `/admin/vente`.

---

## 13. Déploiement

**Hébergement** : Vercel (plan Hobby ou Pro)  
**CI/CD** : déploiement automatique à chaque `git push origin main`  
**Domaine** : `cleviamaroc.com` via Namecheap → DNS pointant vers Vercel

**Variables d'environnement** (Vercel Settings → Environment Variables) :
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://www.cleviamaroc.com
```

**Workflow standard** :
```bash
git add .
git commit -m "feat: description"
git push origin main
# Vercel déploie automatiquement (~1 min)
```

---

## 14. Prochaines évolutions possibles

- [ ] iCal sync Airbnb (synchronisation calendrier disponibilités)
- [ ] Notifications email (nouvelles réservations, nouveaux contacts)
- [ ] Google Maps embed sur les pages détail biens (lat/lng stockés, composant à créer)
- [ ] Galerie photos publique /biens (lightbox full-screen)
- [ ] Contrat de gestion PDF téléchargeable
- [ ] Espace propriétaire connecté (voir ses réservations, ses revenus)
- [ ] Instagram feed automatique (@cleviamaroc)

---

*Généré le 20 avril 2026 — Clévia Conciergerie*
