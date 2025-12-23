-- Garantir que se uma venda for apagada (estorno), o registro financeiro também suma 
-- ou seja marcado como estornado automaticamente.

-- 1. Garante que a coluna venda_id exista
alter table public.financeiro 
add column if not exists venda_id uuid;

-- 2. Remove a restrição antiga se ela existir para evitar conflitos de duplicidade
do $$ 
begin
    if exists (select 1 from pg_constraint where conname = 'financeiro_venda_id_fkey') then
        alter table public.financeiro drop constraint financeiro_venda_id_fkey;
    end if;
end $$;

-- 3. Adiciona a Foreign Key com o comportamento ON DELETE CASCADE
-- Isso garante que ao apagar uma venda, todos os lançamentos financeiros vinculados
-- sejam removidos automaticamente, mantendo o balanço da loja íntegro.
alter table public.financeiro 
add constraint financeiro_venda_id_fkey 
foreign key (venda_id) 
references public.vendas(id) 
on delete cascade;

-- NOTA: Esta implementação é mais segura que o IF NOT EXISTS puro, 
-- pois garante que o comportamento de CASCADE seja aplicado mesmo em colunas já existentes.
