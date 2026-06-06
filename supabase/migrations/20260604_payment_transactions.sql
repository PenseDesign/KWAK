-- ================================================================
-- TABLE: payment_transactions
-- Gère toutes les transactions Mobile Money (MTN MoMo / Orange Money)
-- ================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demande_abonnement_id UUID REFERENCES demandes_abonnement(id) ON DELETE SET NULL,
  phone_number          TEXT NOT NULL,
  operator              TEXT NOT NULL CHECK (operator IN ('mtn', 'orange')),
  amount                DECIMAL(10, 2) NOT NULL,
  currency              TEXT DEFAULT 'XAF',
  reference             TEXT UNIQUE NOT NULL,
  campay_transaction_id TEXT UNIQUE,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed', 'cancelled')),
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_client ON payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_campay_id ON payment_transactions(campay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Client peut voir ses propres transactions
DROP POLICY IF EXISTS "client_read_own_transactions" ON payment_transactions;
CREATE POLICY "client_read_own_transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = client_id);

-- Admin a accès complet
DROP POLICY IF EXISTS "admin_full_access_transactions" ON payment_transactions;
CREATE POLICY "admin_full_access_transactions"
  ON payment_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- FONCTION TRIGGER: Mise à jour automatique de updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_payment_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_transactions_timestamp ON payment_transactions;
CREATE TRIGGER payment_transactions_timestamp
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transaction_timestamp();
