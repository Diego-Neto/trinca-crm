-- ═══════════════════════════════════════════════════════
-- TRINCA DA CERTEZA — Tabela lead_status_history
-- Sprint 3D | @data-engineer (Dara)
-- Rastreia mudanças de status dos leads
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lead_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  vendedor_id UUID NOT NULL,
  status_anterior TEXT NOT NULL,
  status_novo TEXT NOT NULL,
  motivo TEXT,
  dias_no_status_anterior INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendedor_own_history" ON lead_status_history
  FOR ALL USING (vendedor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_lsh_lead ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lsh_created ON lead_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_lsh_vendedor ON lead_status_history(vendedor_id);
