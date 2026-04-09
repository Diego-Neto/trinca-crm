-- ═══════════════════════════════════════════════════════
-- TRINCA DA CERTEZA — Indexes de performance
-- Sprint 3D | @data-engineer (Dara)
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(vendedor_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_touchlog_vendedor_data ON touchlog(vendedor_id, data);
CREATE INDEX IF NOT EXISTS idx_debriefs_vendedor_data ON debriefs(vendedor_id, data);
CREATE INDEX IF NOT EXISTS idx_state_vendedor_data ON state_history(vendedor_id, data);
CREATE INDEX IF NOT EXISTS idx_tasks_vendedor ON tasks(vendedor_id);
