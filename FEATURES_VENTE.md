# FEATURES_VENTE.md — Section "Biens à vendre"
> Plan d'implémentation complet pour Claude Code.
> À exécuter dans l'ordre des sections.

---

## Contexte

Nouvelle section indépendante du site Clévia dédiée à la **vente immobilière**.
Catégories : Appartements, Studios, Villas, Terrains, Fermes, Biens commerciaux.
Même charte graphique que la section location existante (`/biens`).

---

## 1. Base de données Supabase

### 1.1 Table `biens_vente`

```sql
CREATE TABLE IF NOT EXISTS biens_vente (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre           text NOT NULL,
  categorie       text NOT NULL CHECK (categorie IN ('Appartement','Studio','Villa','Terrain','Ferme','Commercial')),
  statut          text NOT NULL DEFAULT 'a_vendre' CHECK (statut IN ('a_vendre','sous_compromis','vendu')),
  prix            decimal(12,2) DEFAULT NULL,       -- NULL = Prix sur demande
  surface         decimal(8,2) DEFAULT NULL,        -- m²
  chambres        int DEFAULT NULL,                  -- NULL pour terrains/commerciaux
  salles_de_bain  int DEFAULT NULL,
  etage           int DEFAULT NULL,
  ville           text NOT NULL,
  adresse         text DEFAULT NULL,
  latitude        decimal(10,7) DEFAULT NULL,
  longitude       decimal(10,7) DEFAULT NULL,
  description     text DEFAULT NULL,
  equipements     text[] DEFAULT '{}',
  photos          text[] DEFAULT '{}',
  telephone       text NOT NULL,                    -- Numéro de contact propre à ce bien
  reference       text UNIQUE,                      -- Ref interne ex: CLV-V-001
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### 1.2 Table `vente_visites` (tracking léger)

```sql
CREATE TABLE IF NOT EXISTS vente_visites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id     uuid NOT NULL REFERENCES biens_vente(id) ON DELETE CASCADE,
  source      text DEFAULT NULL,   -- referrer URL ou 'direct'
  utm_source  text DEFAULT NULL,   -- ?utm_source=
  utm_medium  text DEFAULT NULL,   -- ?utm_medium=
  appareil    text DEFAULT NULL,   -- 'mobile' | 'desktop' | 'tablet'
  pays        text DEFAULT NULL,
  created_at  timestamptz DEFAULT now()
);
```

### 1.3 RLS Policies

```sql
-- biens_vente : lecture publique, écriture admin
ALTER TABLE biens_vente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture publique biens_vente"
  ON biens_vente FOR SELECT USING (true);
CREATE POLICY "écriture admin biens_vente"
  ON biens_vente FOR ALL USING (auth.role() = 'authenticated');

-- vente_visites : insert public (tracking), lecture admin
ALTER TABLE vente_visites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert public vente_visites"
  ON vente_visites FOR INSERT WITH CHECK (true);
CREATE POLICY "lecture admin vente_visites"
  ON vente_visites FOR SELECT USING (auth.role() = 'authenticated');

-- Storage bucket pour photos vente
INSERT INTO storage.buckets (id, name, public)
VALUES ('vente-photos', 'vente-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "upload admin vente-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vente-photos');
CREATE POLICY "lecture publique vente-photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'vente-photos');
CREATE POLICY "delete admin vente-photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vente-photos');
```

---

## 2. API Route — Tracking des visites

### `app/api/vente/track/route.ts`

Route POST appelée côté client à chaque visite d'une page `/vente/[id]`.
Enregistre : `bien_id`, `source` (referrer), `utm_source`, `utm_medium`, `appareil` (détecté via User-Agent).

```
POST /api/vente/track
Body: { bien_id, source, utm_source?, utm_medium? }
Headers: User-Agent (pour détecter appareil)
Response: { ok: true }
```

Logique appareil dans la route :
- `mobile` si UA contient `Mobile` ou `Android`
- `tablet` si UA contient `iPad` ou `Tablet`
- `desktop` sinon

---

## 3. Pages publiques

### 3.1 `/[locale]/vente/page.tsx` — Liste des biens à vendre

**Données** : fetch Supabase `biens_vente` (tous statuts sauf `vendu` par défaut).

**Layout** :
- Hero section (même style que `/biens`) : titre + sous-titre i18n
- Filtres : barre horizontale avec boutons de catégorie (Tous / Appartement / Studio / Villa / Terrain / Ferme / Commercial) + toggle "Afficher les biens vendus"
- Grille responsive : 3 colonnes desktop, 2 tablette, 1 mobile
- Carte `BienVenteCard` (voir §3.3)
- État vide si aucun résultat

**Tri** : par `created_at DESC` par défaut.

### 3.2 `/[locale]/vente/[id]/page.tsx` — Page détail

**Données** :
- Fetch `biens_vente` par id
- `generateMetadata` avec og:title, og:description, og:image (première photo)

**Tracking** : composant client `<VenteTracker bienId={id} />` qui appelle `POST /api/vente/track` au montage (useEffect). Lit `document.referrer`, `URLSearchParams` pour UTM, `navigator.userAgent` pour appareil.

**Layout** (même structure que `/biens/[id]`) :

```
┌─────────────────────────────────────────────┐
│  ← Retour    RÉFÉRENCE: CLV-V-001           │
├─────────────────────────────────────────────┤
│  Galerie photos (BienGallery existant)       │
├──────────────────────────┬──────────────────┤
│  Infos principales       │  Card CTA sticky  │
│  - Titre                 │  - Prix / Sur dem.│
│  - Badges statut/catég.  │  - Tél. bien      │
│  - Stats (surface, ch.)  │  - Btn WhatsApp   │
│  - Description           │  - Btn appel      │
│  - Équipements           │  - Btn contact    │
│  - Localisation + Carte  │                   │
└──────────────────────────┴──────────────────┘
│  Autres biens à vendre (3 cartes similaires) │
└─────────────────────────────────────────────┘
```

**Carte Google Maps** : embed iframe avec `latitude`/`longitude` ou recherche par adresse si pas de coordonnées.
Format : `https://maps.google.com/maps?q={lat},{lng}&output=embed`
Si pas de coordonnées : `https://maps.google.com/maps?q={adresse+ville}&output=embed`

**JSON-LD** : schema.org `RealEstateListing` avec prix, adresse, surface.

### 3.3 Composant `BienVenteCard`

Similaire à `BienCard` existant. Contient :
- Photo principale (ou placeholder)
- Badge statut : vert "À vendre" / orange "Sous compromis" / gris "Vendu"
- Badge catégorie (coin)
- Titre, ville
- Prix en MAD formaté (ou "Prix sur demande" en italic)
- Stats : surface m² / chambres (si applicable)
- Bouton "Voir le bien" → `/[locale]/vente/[id]`

---

## 4. Admin — `/admin/vente`

### 4.1 Page liste `app/admin/(authenticated)/vente/page.tsx`

**Tableau** avec colonnes :
- Miniature (première photo)
- Titre + Référence
- Catégorie
- Statut (badge coloré)
- Prix (ou "Sur demande")
- Ville
- Visites (total depuis `vente_visites`)
- Date ajout
- Actions : Modifier / Supprimer

**Stats en haut** (4 cartes) :
- Total biens actifs
- Total visites (tous biens)
- Bien le plus consulté
- Biens vendus ce mois

### 4.2 Modal formulaire complet

**Sections du formulaire** :

```
1. Informations générales
   - Titre *
   - Référence (ex: CLV-V-001)
   - Catégorie * (select)
   - Statut * (select)

2. Prix
   - Toggle "Prix sur demande"
   - Champ prix (MAD) [masqué si sur demande]

3. Caractéristiques
   - Surface (m²)
   - Chambres [masqué si Terrain/Commercial]
   - Salles de bain [masqué si Terrain/Commercial]
   - Étage [masqué si Terrain/Ferme]

4. Localisation
   - Ville *
   - Adresse
   - Latitude / Longitude (2 champs côte à côte)
   - Lien Google Maps (optionnel — pour extraire lat/lng manuellement)

5. Contact
   - Numéro de téléphone * (propre à ce bien)

6. Description
   - Textarea

7. Équipements
   - Checkboxes (liste réutilisant EQUIPEMENTS de lib/equipements.ts)

8. Photos
   - Upload multiple (bucket vente-photos)
   - Sélection photo principale (★)
   - Réorganisation par clic
```

### 4.3 Onglet Statistiques par bien

Dans le modal ou page dédiée `/admin/vente/[id]/stats` :
- Total visites
- Visites par jour (7 derniers jours) — tableau simple
- Répartition par source (direct / google / facebook / autre)
- Répartition par appareil (mobile / desktop / tablet)
- Pas de données financières exposées ici

---

## 5. Intégrations globales

### 5.1 Navbar

Ajouter "Biens à vendre" dans `components/Navbar.tsx` entre "Nos biens" et "Contact".
Route : `/[locale]/vente`

### 5.2 Homepage

Ajouter une section `HomeBiensVenteSection` dans `app/[locale]/page.tsx` après la section location existante.
Affiche les **3 derniers biens à vendre** (statut `a_vendre`) avec un CTA "Voir tous les biens".

### 5.3 Sidebar Admin

Ajouter "Vente" dans `components/admin/AdminSidebar.tsx` avec icône maison + €.

### 5.4 Sitemap

Ajouter les routes `/[locale]/vente` et `/[locale]/vente/[id]` dans `app/sitemap.ts`.

---

## 6. Internationalisation

Ajouter dans `messages/fr.json`, `messages/ar.json`, `messages/en.json` :

```json
"vente": {
  "tag": "Immobilier",
  "hero": {
    "title": "Biens à vendre",
    "subtitle": "Trouvez votre prochain investissement à Mansouria et Mohammedia"
  },
  "categories": {
    "all": "Tous",
    "Appartement": "Appartements",
    "Studio": "Studios",
    "Villa": "Villas",
    "Terrain": "Terrains",
    "Ferme": "Fermes",
    "Commercial": "Biens commerciaux"
  },
  "statuts": {
    "a_vendre": "À vendre",
    "sous_compromis": "Sous compromis",
    "vendu": "Vendu"
  },
  "prix": {
    "surDemande": "Prix sur demande",
    "mad": "MAD"
  },
  "card": {
    "voirBien": "Voir le bien"
  },
  "detail": {
    "retour": "Retour aux biens",
    "surface": "Surface",
    "chambres": "Chambres",
    "sdb": "Salles de bain",
    "etage": "Étage",
    "localisation": "Localisation",
    "contacter": "Contacter",
    "appeler": "Appeler",
    "whatsapp": "WhatsApp",
    "autresBiens": "Autres biens à vendre",
    "nonTrouve": "Bien introuvable"
  }
}
```

---

## 7. Ordre d'implémentation recommandé

1. **SQL** → exécuter dans Supabase Dashboard
2. **`app/api/vente/track/route.ts`** → route tracking
3. **`messages/*.json`** → traductions
4. **`components/BienVenteCard.tsx`** → carte réutilisable
5. **`app/[locale]/vente/page.tsx`** → liste publique
6. **`components/vente/VenteTracker.tsx`** → composant client tracking
7. **`app/[locale]/vente/[id]/page.tsx`** → page détail + JSON-LD + OG
8. **`app/admin/(authenticated)/vente/page.tsx`** → admin CRUD complet
9. **`components/Navbar.tsx`** → ajout lien "Biens à vendre"
10. **`components/admin/AdminSidebar.tsx`** → ajout lien "Vente"
11. **`components/HomeBiensVenteSection.tsx`** → section homepage
12. **`app/[locale]/page.tsx`** → intégrer la section homepage
13. **`app/sitemap.ts`** → ajouter routes vente

---

## 8. Notes techniques importantes

- **Réutiliser** `BienGallery` existant pour la galerie photos de la page détail
- **Réutiliser** `EQUIPEMENTS` de `lib/equipements.ts` pour les checkboxes admin
- **Ne pas hardcoder** de texte — tout passe par `messages/*.json`
- **Mobile-first** — tester la carte et la galerie sur 375px
- **Inline styles** pour les couleurs dynamiques (statuts) afin d'éviter les problèmes Tailwind v4
- **Tracking** : appel fire-and-forget (pas d'await bloquant le rendu)
- **Google Maps** : iframe embed gratuit, pas besoin d'API key pour l'embed basique
- **Prix** : formater avec `toLocaleString('fr-MA')` → `1 250 000 MAD`
