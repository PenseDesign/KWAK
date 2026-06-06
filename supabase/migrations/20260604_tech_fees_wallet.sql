-- ================================================================
-- TABLE: tech_fees_wallet
-- Gère le portefeuille des frais techniques (redevances développeur)
-- ================================================================

CREATE TABLE IF NOT EXISTS tech_fees_wallet (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  balance_xaf           DECIMAL(15, 2) DEFAULT 0,
  total_accumulated     DECIMAL(15, 2) DEFAULT 0, -- Total cumulé depuis le début
  total_withdrawn       DECIMAL(15, 2) DEFAULT 0, -- Total retiré
  last_withdrawal_date  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer un seul portefeuille global
INSERT INTO tech_fees_wallet (balance_xaf, total_accumulated, total_withdrawn)
SELECT 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM tech_fees_wallet);

ALTER TABLE tech_fees_wallet ENABLE ROW LEVEL SECURITY;

-- Admin uniquement
DROP POLICY IF EXISTS "admin_full_access_wallet" ON tech_fees_wallet;
CREATE POLICY "admin_full_access_wallet"
  ON tech_fees_wallet FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- TABLE: tech_fees_transactions
-- Historique des redevances et retraits
-- ================================================================

CREATE TABLE IF NOT EXISTS tech_fees_transactions (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id                 UUID NOT NULL REFERENCES tech_fees_wallet(id) ON DELETE CASCADE,
  payment_transaction_id    UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  type                      TEXT NOT NULL CHECK (type IN ('fee_credit', 'withdrawal')),
  amount                    DECIMAL(15, 2) NOT NULL,
  description               TEXT,
  status                    TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  withdrawal_phone          TEXT, -- Numéro utilisé pour le retrait
  withdrawal_reference      TEXT, -- Référence Campay du retrait
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_fees_transactions_wallet ON tech_fees_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_tech_fees_transactions_type ON tech_fees_transactions(type);
CREATE INDEX IF NOT EXISTS idx_tech_fees_transactions_status ON tech_fees_transactions(status);

ALTER TABLE tech_fees_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_tech_transactions" ON tech_fees_transactions;
CREATE POLICY "admin_full_access_tech_transactions"
  ON tech_fees_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- FONCTION: Mettre à jour le timestamp
-- ================================================================
CREATE OR REPLACE FUNCTION update_tech_fees_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tech_fees_wallet_timestamp ON tech_fees_wallet;
CREATE TRIGGER tech_fees_wallet_timestamp
  BEFORE UPDATE ON tech_fees_wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_tech_fees_timestamp();

DROP TRIGGER IF EXISTS tech_fees_transactions_timestamp ON tech_fees_transactions;
CREATE TRIGGER tech_fees_transactions_timestamp
  BEFORE UPDATE ON tech_fees_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_tech_fees_timestamp();

-- ================================================================
-- FONCTION: Ajouter une redevance au portefeuille
-- ================================================================
CREATE OR REPLACE FUNCTION add_tech_fee(
  p_amount DECIMAL,
  p_payment_transaction_id UUID,
  p_description TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Récupère le portefeuille (il n'y en a qu'un)
  SELECT id INTO v_wallet_id FROM tech_fees_wallet LIMIT 1;
  
  -- Met à jour le solde
  UPDATE tech_fees_wallet
  SET 
    balance_xaf = balance_xaf + p_amount,
    total_accumulated = total_accumulated + p_amount
  WHERE id = v_wallet_id;
  
  -- Enregistre la transaction
  INSERT INTO tech_fees_transactions (
    wallet_id,
    payment_transaction_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    v_wallet_id,
    p_payment_transaction_id,
    'fee_credit',
    p_amount,
    COALESCE(p_description, 'Frais techniques de transaction'),
    'completed'
  );
END;
$$ LANGUAGE plpgsql;
