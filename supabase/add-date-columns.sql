-- Sprint 1A: Adiciona colunas de data de conversão na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_ganho DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_perda DATE;
