-- ================================================================
-- KWAK — Script SQL Complet à exécuter dans Supabase SQL Editor
-- Copiez TOUT ce contenu et collez-le dans l'éditeur SQL Supabase
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE: profiles
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin', 'pending_agent')),
  phone         TEXT,
  repere_textuel TEXT,
  coords_gps    JSONB,
  photo_facade_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;
CREATE POLICY "admin_full_access_profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 2. TABLE: abonnements
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abonnements (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type_forfait  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'suspendu', 'en_retard')),
  date_debut    DATE,
  date_fin      DATE,
  jours_passage INTEGER[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abonnements_client ON abonnements(client_id);

-- Contrainte UNIQUE nécessaire pour le upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'abonnements_client_id_key'
  ) THEN
    ALTER TABLE abonnements ADD CONSTRAINT abonnements_client_id_key UNIQUE (client_id);
  END IF;
END $$;

ALTER TABLE abonnements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_read_own_abonnement" ON abonnements;
CREATE POLICY "client_read_own_abonnement"
  ON abonnements FOR SELECT
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "admin_full_access_abonnements" ON abonnements;
CREATE POLICY "admin_full_access_abonnements"
  ON abonnements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------
-- 3. TABLE: tournees
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournees (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  statut     TEXT NOT NULL DEFAULT 'prete' CHECK (statut IN ('prete', 'en_cours', 'terminee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournees_agent ON tournees(agent_id);
CREATE INDEX IF NOT EXISTS idx_tournees_date ON tournees(date);

ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_read_own_tournees" ON tournees;
CREATE POLICY "agent_read_own_tournees"
  ON tournees FOR SELECT
  USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "admin_full_access_tournees" ON tournees;
CREATE POLICY "admin_full_access_tournees"
  ON tournees FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------
-- 4. TABLE: passages
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournee_id      UUID NOT NULL REFERENCES tournees(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('valide', 'absent', 'impossible', 'en_attente')),
  photo_preuve_url TEXT,
  heure_passage   TIMESTAMPTZ,
  date_prevue     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passages_tournee ON passages(tournee_id);
CREATE INDEX IF NOT EXISTS idx_passages_client ON passages(client_id);

ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_read_own_passages" ON passages;
CREATE POLICY "client_read_own_passages"
  ON passages FOR SELECT
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "agent_access_passages" ON passages;
CREATE POLICY "agent_access_passages"
  ON passages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tournees t
      WHERE t.id = tournee_id AND t.agent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_full_access_passages" ON passages;
CREATE POLICY "admin_full_access_passages"
  ON passages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------
-- 5. TABLE: signalements
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signalements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ouvert' CHECK (status IN ('ouvert', 'traité', 'fermé')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------
-- 6. TABLE: demandes_abonnement
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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------
-- 7. TRIGGER : créer automatiquement un profil à l'inscription
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- 8. COMPTE ADMIN — groupelpcinfo@gmail.com
-- (À exécuter APRÈS que le compte soit créé via l'interface Auth de Supabase)
-- Voir étape 2 ci-dessous
-- ----------------------------------------------------------------
