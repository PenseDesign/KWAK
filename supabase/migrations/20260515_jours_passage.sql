-- ================================================================
-- KWAK — Migration Jours de Passage
-- ================================================================

-- Ajout de la colonne pour stocker les jours de la semaine (0=Dimanche, 1=Lundi, etc.)
ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS jours_passage INTEGER[] DEFAULT '{}';

-- Index pour accélérer la recherche par jour
CREATE INDEX IF NOT EXISTS idx_abonnements_jours_passage ON abonnements USING GIN (jours_passage);
