-- ═══════════════════════════════════════════════════════
-- TRINCA DA CERTEZA — RUN-ALL: Todas as migrações SQL
-- Sprint 3D | @data-engineer (Dara)
--
-- Cole INTEIRO no Supabase Dashboard > SQL Editor > Run
-- ═══════════════════════════════════════════════════════


-- ─── 1. DATE COLUMNS ─────────────────────────────────
-- Sprint 1A: Adiciona colunas de data de conversão na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_ganho DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_perda DATE;


-- ─── 2. UPDATED_AT + TRIGGER ─────────────────────────
-- Garante que updated_at é atualizado automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['leads','touchlog','debriefs','state_history','tasks','config'])
  LOOP
    -- Adiciona coluna updated_at se não existir
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()', t);
    -- Cria trigger
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t
    );
  END LOOP;
END $$;


-- ─── 3. INDEXES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(vendedor_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_touchlog_vendedor_data ON touchlog(vendedor_id, data);
CREATE INDEX IF NOT EXISTS idx_debriefs_vendedor_data ON debriefs(vendedor_id, data);
CREATE INDEX IF NOT EXISTS idx_state_vendedor_data ON state_history(vendedor_id, data);
CREATE INDEX IF NOT EXISTS idx_tasks_vendedor ON tasks(vendedor_id);


-- ─── 4. STATUS HISTORY TABLE ─────────────────────────
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


-- ═══════════════════════════════════════════════════════
-- FIM — Todas as migrações aplicadas com sucesso!
-- ═══════════════════════════════════════════════════════
