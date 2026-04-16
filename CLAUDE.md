# CLAUDE.md — Clévia Conciergerie
> Fichier de contexte projet pour Claude Code.
> Mis à jour au fur et à mesure de l'avancement.

---

## 1. C'est quoi ce projet ?

**Clévia** est une conciergerie de location courte durée basée à
**Mansouria-Mohammedia, Maroc**. Elle gère des biens immobiliers pour
le compte de propriétaires et les loue via Airbnb, Booking et Avito.

- Commission : 20–25% sur les revenus générés
- Objectif : gérer 5–6 biens d'ici l'été
- Objectif de taux d'occupation : 15+ nuits louées / mois / bien
- Cadre 100% légal, contrat de gestion signé avec chaque propriétaire

---

## 2. Stack technique

| Outil | Rôle |
|---|---|
| Next.js 14 (App Router) | Framework principal |
| TypeScript | Langage |
| Tailwind CSS | Styles |
| Supabase | BDD PostgreSQL + Auth + Storage |
| next-intl | Traductions FR / AR / EN |
| Framer Motion | Animations |
| Vercel | Déploiement production |
| GitHub | Contrôle de version |
| Namecheap | Domaine : cleviamaroc.com |

---

## 3. URLs importantes

| Environnement | URL |
|---|---|
| Production | https://www.cleviamaroc.com |
| Vercel (backup) | https://clevia-website.vercel.app |
| Admin | https://www.cleviamaroc.com/fr/admin |
| Supabase Dashboard | https://supabase.com (projet Clévia) |
| GitHub repo | https://github.com/iMouad/clevia-website |

---

## 4. Structure des fichiers

```
clevia-website/
├── app/
│   └── [locale]/          ← routing i18n (fr / ar / en)
│       ├── layout.tsx      ← layout global + RTL arabe
│       ├── page.tsx        ← page d'accueil
│       ├── services/
│       ├── comment/
│       ├── pourquoi/
│       ├── contact/
│       ├── biens/          ← page biens publique
│       └── admin/          ← panel admin protégé
│           ├── login/
│           ├── biens/
│           ├── reservations/
│           ├── contacts/
│           └── settings/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
├── lib/
│   └── supabase.ts         ← client Supabase (browser + server)
├── messages/
│   ├── fr.json             ← traductions françaises
│   ├── ar.json             ← traductions arabes
│   └── en.json             ← traductions anglaises
├── public/
│   ├── logo.svg            ← logo complet (fond clair)
│   ├── logo-light.svg      ← logo version fond sombre
│   ├── icon.svg            ← icône seule
│   └── favicon.svg         ← favicon
├── middleware.ts            ← protection routes /admin + routing i18n
├── CLAUDE.md               ← ce fichier
└── .env.local              ← variables d'environnement (jamais committer)
```

---

## 5. Variables d'environnement

Fichier `.env.local` à la racine (ne jamais committer sur GitHub) :

```
NEXT_PUBLIC_SUPABASE_URL=           ← Project URL Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=      ← Publishable key Supabase
SUPABASE_SERVICE_ROLE_KEY=          ← Secret key Supabase
NEXT_PUBLIC_SITE_URL=https://www.cleviamaroc.com
```

Ces mêmes variables sont configurées dans Vercel →
Settings → Environment Variables.

---

## 6. Base de données Supabase

### Tables existantes

**biens**
```sql
id uuid PK | nom text | ville text | type text
capacite int | prix_nuit decimal | description text
statut text (actif/en_attente/inactif) | photos text[]
created_at timestamptz | updated_at timestamptz
```

**reservations**
```sql
id uuid PK | bien_id uuid FK→biens
voyageur_nom text | voyageur_email text | voyageur_phone text
date_arrivee date | date_depart date
plateforme text (Airbnb/Booking/Avito/Direct)
montant decimal | taux_commission decimal (20.00 par défaut)
statut text (confirmee/annulee/terminee) | notes text
created_at timestamptz
```

**contacts**
```sql
id uuid PK | nom text | email text | telephone text
ville_bien text | type_bien text | message text
traite boolean (default false) | created_at timestamptz
```

**settings**
```sql
key text PK | value_fr text | value_ar text | value_en text
updated_at timestamptz
```

### Calculs importants
- Nuits réservées : `date_depart - date_arrivee` en jours
- Commission : `montant × (taux_commission / 100)`
- Taux d'occupation : `(SUM nuits du mois) / (biens_actifs × 30) × 100`

### Storage
- Bucket : `biens-photos` (public)
- Usage : upload photos des biens depuis l'admin

### RLS (Row Level Security)
- `biens` : lecture publique si statut='actif', full access si authentifié
- `reservations` : accès authentifié uniquement
- `contacts` : insert public (formulaire), lecture/update authentifié
- `settings` : lecture publique, écriture authentifié

---

## 7. Identité graphique — NE JAMAIS MODIFIER

### Couleurs (CSS variables + Tailwind)
```css
--brun:       #2C1A0E   /* fond sombre, textes principaux */
--terra:      #C97B4B   /* couleur accent principale */
--sable:      #E8A87C   /* accent secondaire */
--corail:     #F0997B   /* accent tertiaire */
--creme:      #FAF6F1   /* fond clair principal */
--brun-mid:   #6B4C35   /* textes secondaires */
--brun-light: #A07850   /* détails */
```

### Typographie
- Titres h1/h2/h3 : **Cormorant Garamond** (Google Fonts), weight 400
- Corps / UI : **DM Sans** (Google Fonts), weight 300/400/500
- Italique coloré (ex: "notre priorité") : Cormorant Garamond italic + color terra

### Logo SVG (icône seule — à utiliser partout)
```svg
<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
  <circle cx="18" cy="18" r="17" fill="#C97B4B"/>
  <circle cx="18" cy="18" r="12.5" fill="#FAF6F1"/>
  <path d="M18 7C18 7 11 12 11 18C11 21.9 14.1 25 18 25C21.9 25 25 21.9 25 18C25 12 18 7Z" fill="#C97B4B"/>
  <circle cx="18" cy="17.5" r="2.8" fill="#FAF6F1"/>
  <rect x="16.5" y="20.3" width="4" height="1.8" rx="0.9" fill="#FAF6F1"/>
  <rect x="18.5" y="22.1" width="4" height="1.8" rx="0.9" fill="#FAF6F1"/>
</svg>
```

### Fichiers logo dans /public/
- `logo.svg` → logo complet (icône + texte "Clévia" + "CONCIERGERIE") fond clair
- `logo-light.svg` → même logo version fond sombre (footer, admin)
- `icon.svg` → icône seule (petits formats)
- `favicon.svg` → identique à icon.svg

### Sections alternées
- Claire : `bg-creme py-24`
- Sombre : `bg-brun py-24` (texte `text-creme`, muted `text-creme/70`)
- Accent : `bg-terra py-20` (texte `text-white`)

### Boutons
```
Primaire : bg-terra text-creme rounded-full px-8 py-3 hover:bg-brun
Ghost    : border-2 border-brun text-brun rounded-full px-8 py-3 hover:bg-brun hover:text-creme
Outline  : border border-terra text-terra rounded-full px-6 py-2 hover:bg-terra hover:text-white
```

### Cards
```
bg-white border border-brun/10 rounded-2xl p-8
hover:-translate-y-1 hover:shadow-lg transition-all duration-200
```

---

## 8. Pages publiques existantes

| Route | Statut | Description |
|---|---|---|
| `/[locale]` | ✅ Live | Page d'accueil complète |
| `/[locale]/services` | ✅ Live | 6 services + tarification |
| `/[locale]/comment` | ✅ Live | Process 6 étapes |
| `/[locale]/pourquoi` | ✅ Live | 4 arguments + chiffres |
| `/[locale]/contact` | ✅ Live | Formulaire → Supabase |
| `/[locale]/biens` | ✅ Live | Biens disponibles (depuis Supabase) |

---

## 9. Panel admin existant

| Route | Statut | Description |
|---|---|---|
| `/[locale]/admin/login` | ✅ Live | Auth Supabase |
| `/[locale]/admin` | ✅ Live | Dashboard + stats |
| `/[locale]/admin/biens` | ✅ Live | CRUD + upload photos |
| `/[locale]/admin/reservations` | ✅ Live | CRUD + calculs commission |
| `/[locale]/admin/contacts` | ✅ Live | Demandes formulaire |
| `/[locale]/admin/settings` | ✅ Live | Textes éditables FR/AR/EN |

Accès admin : email + mot de passe créé dans Supabase Auth.
Le middleware Next.js protège toutes les routes `/admin/*`.

---

## 10. Internationalisation (next-intl)

- Locales supportées : `fr` (défaut), `ar`, `en`
- Fichiers : `messages/fr.json`, `messages/ar.json`, `messages/en.json`
- RTL automatique : `<html dir={locale === 'ar' ? 'rtl' : 'ltr'}>`
- RÈGLE ABSOLUE : zéro texte hardcodé dans les composants.
  Toujours utiliser `useTranslations()`.

---

## 11. Déploiement

- **Déploiement automatique** à chaque push sur la branche `main`
- Vercel rebuild automatiquement le site
- Pour redéployer manuellement : Vercel → Deployments → Redeploy

### Workflow Git standard
```bash
git add .
git commit -m "feat: description du changement"
git push origin main
# → Vercel déploie automatiquement
```

---

## 12. Règles importantes à toujours respecter

1. **Ne jamais committer `.env.local`** — il est dans `.gitignore`
2. **Ne jamais hardcoder de texte** dans les composants — tout passe par `messages/*.json`
3. **Ne jamais modifier les couleurs ou le logo** sans validation
4. **Toujours tester en arabe** (RTL) après chaque modification de layout
5. **Mobile-first** — tester à 375px, 768px, 1440px
6. **Server Actions** pour les mutations Supabase (pas d'appels directs client)
7. **Après chaque nouvelle feature** → `git commit` + `git push`

---

## 13. Prochaines évolutions prévues

- [ ] Stratégie réseaux sociaux (Instagram + Facebook @cleviamaroc)
- [ ] Flyers de prospection propriétaires
- [ ] Contrat de gestion PDF (modèle légal Maroc)
- [ ] Intégration calendrier Airbnb (iCal sync)
- [ ] Système de notifications email (nouvelles réservations, nouveaux contacts)
- [ ] Galerie photos publique des biens sur `/biens`

---

## 14. Contexte business (pour décisions techniques)

- Cible principale : propriétaires de biens à Mansouria / Mohammedia
- Cible secondaire : voyageurs marocains et internationaux
- Plateformes de distribution : Airbnb, Booking.com, Avito.ma
- Saison haute : été (juin–septembre) — priorité absolue
- 1 bien existant géré (propriétaire référent)
- Objectif d'ici l'été : 5–6 biens actifs

---

*Dernière mise à jour : 2026*
*Ce fichier doit être mis à jour à chaque évolution majeure du projet.*