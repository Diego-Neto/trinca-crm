-- Adicionar UNIQUE constraint se não existir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'state_history_vendedor_data_unique') THEN
    ALTER TABLE state_history ADD CONSTRAINT state_history_vendedor_data_unique UNIQUE (vendedor_id, data);
  END IF;
END $$;

-- Limpar dados órfãos
DELETE FROM state_history WHERE vendedor_id IS NULL;
DELETE FROM debriefs WHERE vendedor_id IS NULL;
DELETE FROM touchlog WHERE vendedor_id IS NULL;
DELETE FROM tasks WHERE vendedor_id IS NULL;
DELETE FROM config WHERE vendedor_id IS NULL;
