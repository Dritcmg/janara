-- Migration: Enterprise Features
-- 1. Create Stock Movement History Table (Audit Log)
create table if not exists public.movimentacoes_estoque (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references public.produtos(id),
  quantidade_anterior integer, -- Snapshot of stock before change
  quantidade_nova integer,     -- Snapshot of stock after change
  quantidade_alterada integer, -- The delta (+10, -1, etc)
  motivo text, -- 'venda', 'ajuste_manual', 'entrada_fornecedor'
  usuario_id uuid default auth.uid(), -- Optional: capture who made the change
  created_at timestamp with time zone default now()
);

-- Enable RLS on new table
alter table public.movimentacoes_estoque enable row level security;
create policy "Enable all for authenticated users" on public.movimentacoes_estoque for all using (auth.role() = 'authenticated');

-- 2. Add venda_id to Financeiro (Linkage)
alter table public.financeiro
add column if not exists venda_id uuid references public.vendas(id) on delete set null;

-- 3. Update finalizing sale RPC to log stock changes and link finance
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
  v_current_stock integer;
begin
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
    -- Get current stock
    select qtd into v_current_stock from public.produtos where id = (v_item->>'produto_id')::uuid;

    -- Decrease Stock (Atomic)
    update public.produtos
    set qtd = qtd - (v_item->>'quantidade')::int
    where id = (v_item->>'produto_id')::uuid;

    -- Log Stock Movement
    insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
    values (
        (v_item->>'produto_id')::uuid,
        v_current_stock,
        v_current_stock - (v_item->>'quantidade')::int,
        -(v_item->>'quantidade')::int,
        'venda'
    );

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

  -- 3. Add to Financial (Now with Link!)
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
