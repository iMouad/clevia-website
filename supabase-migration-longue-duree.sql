-- Migration : ajout du mode location longue durée
-- À exécuter dans Supabase SQL Editor

ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS mode_location text NOT NULL DEFAULT 'courte_duree'
    CHECK (mode_location IN ('courte_duree', 'longue_duree')),
  ADD COLUMN IF NOT EXISTS prix_mensuel decimal,
  ADD COLUMN IF NOT EXISTS charges_incluses boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS meuble boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS duree_min_mois integer;
