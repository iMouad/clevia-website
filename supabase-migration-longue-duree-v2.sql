-- Migration v2 : champs supplémentaires longue durée
-- À exécuter dans Supabase SQL Editor

ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS caution decimal,
  ADD COLUMN IF NOT EXISTS disponible_le date,
  ADD COLUMN IF NOT EXISTS conditions text;
