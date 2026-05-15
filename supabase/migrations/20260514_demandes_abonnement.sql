-- ============================================================
-- KWAK — Migration : Table demandes_abonnement
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Table pour stocker les demandes d'abonnement en attente de validation
CREATE TABLE IF NOT EXISTS demandes_abonnement (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type_forfait        TEXT NOT NULL CHECK (type_forfait IN ('Mensuel Basique', 'Mensuel Pro', 'Hebdomadaire')),
  operateur_paiement  TEXT NOT NULL CHECK (operateur_paiement IN ('mtn', 'orange')),
  phone_paiement      TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'actif', 'refuse')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS idx_demandes_client ON demandes_abonnement(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_status ON demandes_abonnement(status);

-- RLS : activé
ALTER TABLE demandes_abonnement ENABLE ROW LEVEL SECURITY;

-- Clients : peuvent créer leur propre demande et lire la leur
CREATE POLICY "client_insert_own_demande"
  ON demandes_abonnement FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "client_read_own_demande"
  ON demandes_abonnement FOR SELECT
  USING (auth.uid() = client_id);

-- Admins : accès complet (via service role ou policy spécifique)
CREATE POLICY "admin_full_access_demandes"
  ON demandes_abonnement FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Vérifier que la table abonnements a la colonne client_id unique
-- pour permettre le upsert dans activateAbonnement()
-- ============================================================
-- Si la table abonnements n'a pas de contrainte UNIQUE sur client_id, ajouter :
-- ALTER TABLE abonnements ADD CONSTRAINT abonnements_client_id_key UNIQUE (client_id);
