-- JANARA PRODUCTION DATABASE SCHEMA
-- Generated for Production Deployment
-- UPDATED: Idempotent (Safe to run on existing databases)

-- 1. TABLES & COLUMNS
-- ============================================================================

-- Produtos
create table if not exists public.produtos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  categoria text,
  tamanho text,
  cor text,
  custo numeric,
  preco_venda numeric not null,
  qtd integer default 0,
  estoque_minimo integer default 5,
  imagem text
);

-- Clientes
create table if not exists public.clientes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  email text,
  telefone text
);

-- Vendas
create table if not exists public.vendas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  cliente_id uuid references public.clientes(id),
  valor_total numeric not null,
  subtotal numeric,
  desconto numeric,
  metodo_pagamento text
);

-- Itens da Venda
create table if not exists public.itens_venda (
  id uuid default gen_random_uuid() primary key,
  venda_id uuid references public.vendas(id) on delete cascade not null,
  produto_id uuid references public.produtos(id),
  nome_produto text, -- Snapshot
  preco_unitario numeric not null, -- Snapshot
  quantidade integer not null
);

-- Movimentacoes de Estoque (Audit Log)
create table if not exists public.movimentacoes_estoque (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references public.produtos(id),
  quantidade_anterior integer,
  quantidade_nova integer,
  quantidade_alterada integer,
  motivo text, -- 'venda', 'ajuste_manual', 'entrada_fornecedor'
  usuario_id uuid default auth.uid(), -- Capture who made the change
  created_at timestamp with time zone default now()
);

-- Financeiro
create table if not exists public.financeiro (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  data timestamp with time zone default timezone('utc'::text, now()) not null,
  tipo text check (tipo in ('entrada', 'saida')) not null,
  categoria text,
  descricao text,
  valor numeric not null
);

-- Safely add 'venda_id' to financeiro if it doesn't exist
alter table public.financeiro 
add column if not exists venda_id uuid references public.vendas(id) on delete cascade;

-- 2. SECURITY (Row Level Security)
-- ============================================================================

-- Enable RLS (Idempotent)
alter table public.produtos enable row level security;
alter table public.clientes enable row level security;
alter table public.vendas enable row level security;
alter table public.itens_venda enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.financeiro enable row level security;

-- Policies (Drop first to avoid 'already exists' errors)
drop policy if exists "Enable all for authenticated users" on public.produtos;
create policy "Enable all for authenticated users" on public.produtos for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all for authenticated users" on public.clientes;
create policy "Enable all for authenticated users" on public.clientes for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all for authenticated users" on public.vendas;
create policy "Enable all for authenticated users" on public.vendas for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all for authenticated users" on public.itens_venda;
create policy "Enable all for authenticated users" on public.itens_venda for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all for authenticated users" on public.movimentacoes_estoque;
create policy "Enable all for authenticated users" on public.movimentacoes_estoque for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all for authenticated users" on public.financeiro;
create policy "Enable all for authenticated users" on public.financeiro for all using (auth.role() = 'authenticated');

-- 3. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to Log Stock Changes Automatically
create or replace function public.fn_log_stock_change()
returns trigger as $$
begin
    -- Check if quantity changed
    if old.qtd is distinct from new.qtd then
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        values (
            new.id,
            old.qtd,
            new.qtd,
            new.qtd - old.qtd,
            -- Read 'app.stock_change_reason' set by RPC, or default to 'ajuste_manual'
            coalesce(current_setting('app.stock_change_reason', true), 'ajuste_manual')
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Create Trigger on produtos (Drop first to avoid errors)
drop trigger if exists tr_log_stock_change on public.produtos;
create trigger tr_log_stock_change
after update on public.produtos
for each row
execute function public.fn_log_stock_change();

-- 4. RPC (STORED PROCEDURES)
-- ============================================================================

-- Finalizar Venda (Atomic Transaction)
-- Handles Sale, Stock Decrease (via UPDATE -> TRIGGER), Item Insertion, and Financial Record
create or replace function finalizar_venda(
  p_venda jsonb,
  p_itens jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_venda_id uuid;
  v_item jsonb;
  v_created_at timestamp with time zone;
begin
  -- Set context for trigger so it knows this is a SALE
  -- The 'true' argument makes it local to this transaction
  perform set_config('app.stock_change_reason', 'venda', true);

  -- 1. Insert Sale
  insert into public.vendas (cliente_id, valor_total, subtotal, desconto, metodo_pagamento)
  values (
    (p_venda->>'cliente_id')::uuid,
    (p_venda->>'valor_total')::numeric,
    (p_venda->>'subtotal')::numeric,
    (p_venda->>'desconto')::numeric,
    p_venda->>'metodo_pagamento'
  )
  returning id, created_at into v_venda_id, v_created_at;

  -- 2. Process Items
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    -- Decrease Stock 
    -- This update fires 'tr_log_stock_change', which logs to 'movimentacoes_estoque' with reason='venda'
    update public.produtos
    set qtd = qtd - (v_item->>'quantidade')::int
    where id = (v_item->>'produto_id')::uuid;

    -- Insert Item
    insert into public.itens_venda (venda_id, produto_id, nome_produto, preco_unitario, quantidade)
    values (
      v_venda_id,
      (v_item->>'produto_id')::uuid,
      v_item->>'nome',
      (v_item->>'preco_unitario')::numeric,
      (v_item->>'quantidade')::int
    );
  end loop;

  -- 3. Add to Financial
  insert into public.financeiro (tipo, categoria, descricao, valor, data, venda_id)
  values (
    'entrada',
    'Vendas',
    'Venda #' || left(v_venda_id::text, 8),
    (p_venda->>'valor_total')::numeric,
    v_created_at,
    v_venda_id
  );

  return jsonb_build_object('id', v_venda_id, 'created_at', v_created_at);
end;
$$;
