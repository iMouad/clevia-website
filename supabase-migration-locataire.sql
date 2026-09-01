-- Migration : ajout des champs locataire pour les biens longue durée loués
-- À exécuter dans Supabase SQL Editor

ALTER TABLE biens ADD COLUMN IF NOT EXISTS locataire_nom text;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS locataire_tel text;
