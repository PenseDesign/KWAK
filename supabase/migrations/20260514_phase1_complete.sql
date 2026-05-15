-- ================================================================
-- KWAK — Migration complète Phase 1 (idempotente)
-- Exécuter dans Supabase SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE: signalements (reportIssue)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signalements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ouvert' CHECK (status IN ('ouvert', 'traité', 'fermé')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signalements_client ON signalements(client_id);
CREATE INDEX IF NOT EXISTS idx_signalements_status ON signalements(status);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_insert_own_signalement" ON signalements;
CREATE POLICY "client_insert_own_signalement"
  ON signalements FOR INSERT
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "client_read_own_signalement" ON signalements;
CREATE POLICY "client_read_own_signalement"
  ON signalements FOR SELECT
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "admin_full_access_signalements" ON signalements;
CREATE POLICY "admin_full_access_signalements"
  ON signalements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 2. TABLE: demandes_abonnement
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demandes_abonnement (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type_forfait        TEXT NOT NULL CHECK (type_forfait IN ('Mensuel Basique', 'Mensuel Pro', 'Hebdomadaire')),
  operateur_paiement  TEXT NOT NULL CHECK (operateur_paiement IN ('mtn', 'orange')),
  phone_paiement      TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'actif', 'refuse')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demandes_client ON demandes_abonnement(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_status ON demandes_abonnement(status);

ALTER TABLE demandes_abonnement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_insert_own_demande" ON demandes_abonnement;
CREATE POLICY "client_insert_own_demande"
  ON demandes_abonnement FOR INSERT
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "client_read_own_demande" ON demandes_abonnement;
CREATE POLICY "client_read_own_demande"
  ON demandes_abonnement FOR SELECT
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "admin_full_access_demandes" ON demandes_abonnement;
CREATE POLICY "admin_full_access_demandes"
  ON demandes_abonnement FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 3. TABLE: abonnements — contrainte UNIQUE sur client_id
--    (nécessaire pour le upsert dans activateAbonnement)
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'abonnements_client_id_key'
  ) THEN
    ALTER TABLE abonnements ADD CONSTRAINT abonnements_client_id_key UNIQUE (client_id);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 4. Fonction trigger : créer automatiquement un profil à l'inscription
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
