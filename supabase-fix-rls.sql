-- ═══════════════════════════════════════════════════════
-- FIX DEFINITIVO: Desabilitar RLS, limpar policies, recriar
-- ═══════════════════════════════════════════════════════

-- PASSO 1: Desabilitar RLS em TODAS as tabelas
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS touchlog DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS debriefs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS state_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS config DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Dropar TODAS as policies existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped: % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- PASSO 3: Reabilitar RLS com policies novas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE touchlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar policies PERMISSIVAS para todas as tabelas

-- LEADS
CREATE POLICY "leads_select" ON leads FOR SELECT USING (auth.uid() = vendedor_id OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'gestor'));
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (auth.uid() = vendedor_id);
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (auth.uid() = vendedor_id) WITH CHECK (auth.uid() = vendedor_id);
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (auth.uid() = vendedor_id);

-- PERFIS
CREATE POLICY "perfis_select" ON perfis FOR SELECT USING (true);
CREATE POLICY "perfis_insert" ON perfis FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfis_update" ON perfis FOR UPDATE USING (auth.uid() = id);

-- TOUCHLOG
CREATE POLICY "touchlog_select" ON touchlog FOR SELECT USING (auth.uid() = vendedor_id);
CREATE POLICY "touchlog_insert" ON touchlog FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

-- DEBRIEFS
CREATE POLICY "debriefs_select" ON debriefs FOR SELECT USING (auth.uid() = vendedor_id);
CREATE POLICY "debriefs_insert" ON debriefs FOR INSERT WITH CHECK (auth.uid() = vendedor_id);
CREATE POLICY "debriefs_update" ON debriefs FOR UPDATE USING (auth.uid() = vendedor_id);

-- STATE_HISTORY
CREATE POLICY "state_select" ON state_history FOR SELECT USING (auth.uid() = vendedor_id);
CREATE POLICY "state_insert" ON state_history FOR INSERT WITH CHECK (auth.uid() = vendedor_id);
CREATE POLICY "state_update" ON state_history FOR UPDATE USING (auth.uid() = vendedor_id);

-- TASKS
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() = vendedor_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = vendedor_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = vendedor_id);

-- CONFIG
CREATE POLICY "config_select" ON config FOR SELECT USING (auth.uid() = vendedor_id);
CREATE POLICY "config_insert" ON config FOR INSERT WITH CHECK (auth.uid() = vendedor_id);
CREATE POLICY "config_update" ON config FOR UPDATE USING (auth.uid() = vendedor_id);

-- VERIFICAÇÃO
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;
