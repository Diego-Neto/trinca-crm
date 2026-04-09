-- ═══════════════════════════════════════════════════════
-- TRINCA DA CERTEZA — Setup RLS Policies
-- Cole INTEIRO no Supabase Dashboard > SQL Editor > Run
-- ═══════════════════════════════════════════════════════

-- ─── TABELA LEADS ────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedor insere seus leads" ON leads;
DROP POLICY IF EXISTS "Vendedor atualiza seus leads" ON leads;
DROP POLICY IF EXISTS "Vendedor ve seus leads" ON leads;
DROP POLICY IF EXISTS "Vendedor deleta seus leads" ON leads;
DROP POLICY IF EXISTS "Gestor ve todos" ON leads;

CREATE POLICY "Vendedor insere seus leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor atualiza seus leads" ON leads
  FOR UPDATE USING (auth.uid() = vendedor_id)
  WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor ve seus leads" ON leads
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor deleta seus leads" ON leads
  FOR DELETE USING (auth.uid() = vendedor_id);

-- Gestor (role = 'gestor') pode ver/editar TODOS os leads
CREATE POLICY "Gestor ve todos" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'gestor')
  );

-- ─── TABELA PERFIS ───────────────────────────────────
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve seu perfil" ON perfis;
DROP POLICY IF EXISTS "Usuario edita seu perfil" ON perfis;
DROP POLICY IF EXISTS "Usuario cria seu perfil" ON perfis;

CREATE POLICY "Usuario cria seu perfil" ON perfis
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuario ve seu perfil" ON perfis
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuario edita seu perfil" ON perfis
  FOR UPDATE USING (auth.uid() = id);

-- ─── TABELA TOUCHLOG ─────────────────────────────────
ALTER TABLE touchlog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedor insere touchlog" ON touchlog;
DROP POLICY IF EXISTS "Vendedor ve touchlog" ON touchlog;

CREATE POLICY "Vendedor insere touchlog" ON touchlog
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor ve touchlog" ON touchlog
  FOR SELECT USING (auth.uid() = vendedor_id);

-- ─── TABELA DEBRIEFS ─────────────────────────────────
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedor insere debriefs" ON debriefs;
DROP POLICY IF EXISTS "Vendedor ve debriefs" ON debriefs;
DROP POLICY IF EXISTS "Vendedor atualiza debriefs" ON debriefs;

CREATE POLICY "Vendedor insere debriefs" ON debriefs
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor ve debriefs" ON debriefs
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor atualiza debriefs" ON debriefs
  FOR UPDATE USING (auth.uid() = vendedor_id);

-- ─── TABELA STATE_HISTORY ────────────────────────────
ALTER TABLE state_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedor insere state" ON state_history;
DROP POLICY IF EXISTS "Vendedor ve state" ON state_history;
DROP POLICY IF EXISTS "Vendedor atualiza state" ON state_history;

CREATE POLICY "Vendedor insere state" ON state_history
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor ve state" ON state_history
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor atualiza state" ON state_history
  FOR UPDATE USING (auth.uid() = vendedor_id);

-- ─── TABELA TASKS ────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedor insere tasks" ON tasks;
DROP POLICY IF EXISTS "Vendedor ve tasks" ON tasks;
DROP POLICY IF EXISTS "Vendedor atualiza tasks" ON tasks;

CREATE POLICY "Vendedor insere tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor ve tasks" ON tasks
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor atualiza tasks" ON tasks
  FOR UPDATE USING (auth.uid() = vendedor_id);

-- ─── TABELA CONFIG ───────────────────────────────────
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedor insere config" ON config;
DROP POLICY IF EXISTS "Vendedor ve config" ON config;
DROP POLICY IF EXISTS "Vendedor atualiza config" ON config;

CREATE POLICY "Vendedor insere config" ON config
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor ve config" ON config
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedor atualiza config" ON config
  FOR UPDATE USING (auth.uid() = vendedor_id);

-- ═══════════════════════════════════════════════════════
-- VERIFICAÇÃO — rode depois pra confirmar
-- ═══════════════════════════════════════════════════════
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
