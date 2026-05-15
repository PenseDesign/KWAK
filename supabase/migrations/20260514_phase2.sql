-- ================================================================
-- KWAK — Migration Phase 2
-- Exécuter dans Supabase SQL Editor
-- ================================================================

-- Colonnes profil client (pour la localisation agent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS repere_textuel TEXT,
  ADD COLUMN IF NOT EXISTS coords_gps JSONB,
  ADD COLUMN IF NOT EXISTS photo_facade_url TEXT;
