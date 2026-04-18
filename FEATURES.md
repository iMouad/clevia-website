# Fonctionnalités à implémenter

---

## Feature 1 — Page "Nos Biens" style Airbnb + Admin enrichi

### Objectif
Afficher les biens avec un niveau de détail proche d'Airbnb : galerie photos, équipements, caractéristiques. L'admin permet de saisir tous ces détails à la création/modification d'un bien.

---

### 1.1 Migration base de données

Ajouter les colonnes suivantes à la table `biens` dans Supabase :

```sql
ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS chambres       int            DEFAULT 1,
  ADD COLUMN IF NOT EXISTS salles_de_bain int            DEFAULT 1,
  ADD COLUMN IF NOT EXISTS capacite_max   int            DEFAULT 2,
  ADD COLUMN IF NOT EXISTS surface        int            DEFAULT NULL,  -- m²
  ADD COLUMN IF NOT EXISTS etage          text           DEFAULT NULL,  -- ex: "2ème étage", "RDC"
  ADD COLUMN IF NOT EXISTS equipements    text[]         DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS regles         text[]         DEFAULT '{}',  -- ex: "Non-fumeur", "Pas d'animaux"
  ADD COLUMN IF NOT EXISTS adresse        text           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS distance_mer   text           DEFAULT NULL,  -- ex: "50m", "5 min à pied"
  ADD COLUMN IF NOT EXISTS disponible     boolean        DEFAULT true;
```

**Valeurs possibles pour `equipements`** (tableau de strings) :
```
wifi, piscine, climatisation, parking, cuisine_equipee, lave_linge,
seche_linge, televiseur, balcon, terrasse, vue_mer, barbecue,
ascenseur, gardien, digicode, fer_a_repasser, machine_cafe,
micro_ondes, lave_vaisselle, baignoire, douche_italienne
```

---

### 1.2 Page publique `/biens` — Affichage

**Layout général** : grille de cards (2 colonnes desktop, 1 colonne mobile)

**Chaque card bien** :
- Galerie photos en carrousel (flèches gauche/droite, dots indicateurs)
- Badge type de bien (Appartement / Villa / Studio) en overlay photo
- Badge "Disponible" / "Non disponible" en overlay photo
- Titre du bien
- Ligne icônes équipements principaux : chambres, sdb, capacité, surface si renseignée
- Distance mer si renseignée
- Prix par nuit mis en avant
- Badges équipements (max 4 visibles + "+ X autres")
- Bouton "Voir les détails" → page detail bien

**Page détail `/biens/[id]`** (nouvelle page) :
- Galerie photos pleine largeur (style Airbnb, grille 1 grande + 4 petites)
- Titre + type + badges disponibilité
- Bloc prix/nuit + bouton "Réserver / Nous contacter"
- Section "Le bien" : description complète
- Grille caractéristiques : chambres, sdb, capacité, surface, étage, distance mer
- Section "Équipements" : icônes + labels pour chaque équipement coché
- Section "Règles" : liste des règles de la maison
- Section "Localisation" : ville + zone (pas de carte pour l'instant)
- CTA final : bouton WhatsApp + lien contact

**Composants à créer** :
- `components/biens/BienCard.tsx` — card grille
- `components/biens/BienGallery.tsx` — carrousel photos
- `components/biens/BienEquipements.tsx` — grille icônes équipements
- `app/[locale]/biens/[id]/page.tsx` — page détail

---

### 1.3 Admin — Formulaire bien enrichi

**Page** : `/admin/biens` (modifier le formulaire existant)

Ajouter les champs suivants au formulaire de création/modification :

```
Informations générales :
- Nombre de chambres (input number, min 1)
- Nombre de salles de bain (input number, min 1)
- Capacité max voyageurs (input number, min 1)
- Surface en m² (input number, optionnel)
- Étage / situation (text, ex: "RDC", "2ème étage avec vue mer")
- Distance mer (text, ex: "50m", "5 min à pied")
- Adresse (text, non affichée publiquement si souhaité)

Équipements (checkboxes) :
□ WiFi          □ Piscine          □ Climatisation    □ Parking
□ Cuisine équipée  □ Lave-linge    □ Sèche-linge      □ Télévision
□ Balcon        □ Terrasse         □ Vue mer          □ Barbecue
□ Ascenseur     □ Gardien          □ Fer à repasser   □ Machine à café
□ Micro-ondes   □ Lave-vaisselle   □ Baignoire        □ Douche italienne

Règles de la maison (checkboxes) :
□ Non-fumeur    □ Pas d'animaux    □ Pas de fêtes     □ Check-in flexible

Disponibilité :
□ Bien disponible à la location (toggle)
```

---

### 1.4 Icônes équipements

Créer un mapping icône SVG pour chaque équipement :

| Clé | Label FR | Icône |
|-----|----------|-------|
| wifi | WiFi | signal wifi |
| piscine | Piscine | vague |
| climatisation | Climatisation | flocon |
| parking | Parking | P |
| cuisine_equipee | Cuisine équipée | casserole |
| lave_linge | Lave-linge | machine |
| televiseur | Télévision | écran |
| balcon | Balcon / Terrasse | balcon |
| vue_mer | Vue mer | horizon |
| barbecue | Barbecue | grill |
| baignoire | Baignoire | baignoire |

Créer `lib/equipements.ts` avec le mapping complet (clé → label FR/AR/EN + icône SVG inline).

---

### 1.5 Traductions à ajouter

Dans `messages/fr.json`, `ar.json`, `en.json` — section `biens` :

```json
"chambres": "chambre(s)",
"sdb": "salle(s) de bain",
"capacite": "voyageurs max",
"surface": "m²",
"equipements": "Équipements",
"regles": "Règles de la maison",
"distanceMer": "de la mer",
"voirDetails": "Voir les détails",
"contacter": "Contacter pour ce bien",
"disponible": "Disponible",
"nonDisponible": "Non disponible"
```

---

---

## Feature 2 — Calendrier de disponibilité + lien propriétaire

### Objectif
Dans l'admin, visualiser et gérer les jours bloqués (réservés) pour chaque bien sur un calendrier mensuel. Générer un lien de partage unique pour chaque propriétaire pour qu'il puisse suivre ses réservations en temps réel.

---

### 2.1 Migration base de données

```sql
-- Jours bloqués manuellement (en dehors des réservations enregistrées)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id     uuid NOT NULL REFERENCES biens(id) ON DELETE CASCADE,
  date        date NOT NULL,
  raison      text DEFAULT NULL,  -- ex: "Réservé Airbnb", "Entretien", "Indisponible"
  created_at  timestamptz DEFAULT now(),
  UNIQUE(bien_id, date)
);

-- Token de partage par propriétaire
CREATE TABLE IF NOT EXISTS owner_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id     uuid NOT NULL REFERENCES biens(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  nom_proprio text DEFAULT NULL,
  created_at  timestamptz DEFAULT now()
);
```

**RLS** :
```sql
-- blocked_dates : lecture publique (pour calendrier propriétaire), écriture admin
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture publique blocked_dates" ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "écriture admin blocked_dates" ON blocked_dates FOR ALL USING (auth.role() = 'authenticated');

-- owner_tokens : lecture par token uniquement (via fonction), écriture admin
ALTER TABLE owner_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "écriture admin owner_tokens" ON owner_tokens FOR ALL USING (auth.role() = 'authenticated');
```

---

### 2.2 Admin — Page calendrier

**Route** : `/admin/calendrier`

**Interface** :

1. **Sélecteur de bien** en haut (dropdown avec tous les biens actifs)

2. **Calendrier mensuel** (navigation mois précédent / suivant) :
   - Jours **verts** : disponibles
   - Jours **rouges** : bloqués (réservations enregistrées dans la table `reservations`)
   - Jours **orange** : bloqués manuellement (table `blocked_dates`)
   - Jours **gris** : passés
   - Clic sur un jour disponible → le bloque (ajoute dans `blocked_dates`)
   - Clic sur un jour orange → le débloque (supprime de `blocked_dates`)
   - Les jours rouges (réservations) ne sont pas cliquables

3. **Légende** sous le calendrier

4. **Section lien propriétaire** :
   - Bouton "Générer un lien propriétaire"
   - Affiche l'URL : `cleviamaroc.com/fr/calendrier/[token]`
   - Bouton "Copier le lien"
   - Bouton "Révoquer le lien" (supprime le token et en génère un nouveau)

**Composants à créer** :
- `components/admin/CalendrierBien.tsx` — le calendrier interactif
- `app/[locale]/admin/calendrier/page.tsx` — page admin
- `app/[locale]/admin/calendrier/actions.ts` — Server Actions (bloquer/débloquer/générer token)

---

### 2.3 Page publique calendrier propriétaire

**Route** : `/calendrier/[token]`

**Interface** :
- Pas de navbar Clévia complète (page standalone propre)
- Logo Clévia en haut
- Nom du bien
- Calendrier mensuel **lecture seule** (navigation mois précédent/suivant)
  - Jours rouges : réservés
  - Jours verts : disponibles
  - Jours gris : passés
- Statistiques simples : nuits réservées ce mois / taux d'occupation
- Pas de données financières (revenus non visibles)

**Composants à créer** :
- `app/[locale]/calendrier/[token]/page.tsx`
- Réutilise le composant calendrier en mode lecture seule

---

### 2.4 Server Actions calendrier

```typescript
// app/[locale]/admin/calendrier/actions.ts

// Récupérer les dates bloquées d'un bien (manuelles + réservations)
getBlockedDates(bienId: string, year: number, month: number)

// Bloquer un jour
blockDate(bienId: string, date: string, raison?: string)

// Débloquer un jour
unblockDate(bienId: string, date: string)

// Générer un token propriétaire
generateOwnerToken(bienId: string, nomProprio?: string)

// Révoquer et regénérer un token
revokeOwnerToken(bienId: string)
```

---

### 2.5 Ajouter "Calendrier" dans la nav admin

Dans la navbar admin, ajouter le lien :
```
Calendrier → /admin/calendrier
```

---

### Ordre d'implémentation recommandé

1. Migration SQL (blocked_dates + owner_tokens + colonnes biens)
2. Feature 1 : enrichissement admin biens + page biens/[id]
3. Feature 1 : refonte cards page /biens
4. Feature 2 : page admin calendrier
5. Feature 2 : page publique /calendrier/[token]
