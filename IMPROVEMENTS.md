# Améliorations à implémenter

## 1. Bouton WhatsApp flottant

**Objectif** : Permettre aux visiteurs de contacter Clévia directement via WhatsApp depuis n'importe quelle page.

**Comportement attendu** :
- Bouton fixe en bas à droite sur toutes les pages (mobile + desktop)
- Ouvre WhatsApp avec un message pré-rempli (ex : "Bonjour, je souhaite en savoir plus sur Clévia Conciergerie")
- Numéro : +212 614 268 283
- Disparaît ou se réduit au scroll vers le bas pour ne pas gêner le contenu

**Implémentation** :
- Créer un composant `WhatsAppButton.tsx` dans `/components`
- L'ajouter dans le layout global `app/[locale]/layout.tsx`
- Lien format : `https://wa.me/212614268283?text=...`
- Style : cercle vert (#25D366) avec icône WhatsApp SVG, ombre légère, z-index élevé
- Traduction du message pré-rempli dans `messages/*.json` (clé `whatsapp.message`)

---

## 2. Capture de lead depuis le simulateur

**Objectif** : Récupérer le numéro de téléphone (ou email) du visiteur au moment où il voit un résultat positif dans le simulateur, avant qu'il quitte la page.

**Comportement attendu** :
- Sous le résultat principal (revenus bruts), afficher un petit formulaire inline : champ téléphone + bouton "Recevoir une estimation détaillée"
- Champ optionnel (pas bloquant) — le visiteur peut ignorer et continuer
- À la soumission : enregistrer dans la table `contacts` Supabase avec `type = 'simulateur'` et les paramètres choisis (type de bien, chambres, options, prix/nuit estimé)
- Afficher un message de confirmation "On vous rappelle sous 24h"

**Implémentation** :
- Ajouter un état `leadCaptured` dans `RevenueCalculator.tsx`
- Formulaire inline dans la colonne résultats, juste au-dessus du bouton "Confier mon bien"
- Server Action pour insérer dans Supabase (table `contacts` existante, ajouter colonne `source text` et `simulation_data jsonb`)
- Migration Supabase : `ALTER TABLE contacts ADD COLUMN source text; ADD COLUMN simulation_data jsonb;`
- Dans l'admin `/admin/contacts` : afficher la colonne source pour distinguer les leads simulateur des contacts formulaire
