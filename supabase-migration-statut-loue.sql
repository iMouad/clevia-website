-- Migration : ajout du statut "loué" pour les biens longue durée
-- À exécuter dans Supabase SQL Editor

-- Supprimer l'ancienne contrainte si elle existe, puis recréer avec "loue"
ALTER TABLE biens DROP CONSTRAINT IF EXISTS biens_statut_check;
ALTER TABLE biens ADD CONSTRAINT biens_statut_check
  CHECK (statut IN ('actif', 'en_attente', 'inactif', 'loue'));
