# Supabase SQL Migrations — Trinca da Certeza

## Como rodar

1. Abra o **Supabase Dashboard** → **SQL Editor**
2. Cole o conteúdo inteiro de `RUN-ALL.sql`
3. Clique em **Run**

Pronto! Todas as migrações serão aplicadas em sequência.

## Arquivos individuais

| Arquivo | O que faz |
|---------|-----------|
| `add-date-columns.sql` | Adiciona `data_ganho` e `data_perda` na tabela leads |
| `supabase-setup.sql` | Setup inicial de RLS policies |
| `supabase-fix-constraints.sql` | UNIQUE constraint em state_history + limpeza de órfãos |
| `supabase-fix-rls.sql` | Fix definitivo de RLS (desabilita, limpa, recria) |
| `indexes.sql` | Indexes de performance para queries frequentes |
| `lead-status-history.sql` | Tabela para rastrear mudanças de status dos leads |
| `RUN-ALL.sql` | Todos os SQLs acima em sequência (use este!) |

## Ordem de execução no RUN-ALL

1. Date columns (`data_ganho`, `data_perda`)
2. `updated_at` + trigger automático em todas as tabelas
3. Indexes de performance
4. Tabela `lead_status_history` com RLS
