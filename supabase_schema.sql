-- Create Tables

-- 1. PRODUTOS
create table public.produtos (
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

-- 2. CLIENTES
create table public.clientes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  email text,
  telefone text
);

-- 3. VENDAS
create table public.vendas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  cliente_id uuid references public.clientes(id),
  valor_total numeric not null,
  subtotal numeric,
  desconto numeric,
  metodo_pagamento text
);

-- 4. ITENS DA VENDA
create table public.itens_venda (
  id uuid default gen_random_uuid() primary key,
  venda_id uuid references public.vendas(id) on delete cascade not null,
  produto_id uuid references public.produtos(id),
  nome_produto text, -- Snapshot do nome na hora da venda
  preco_unitario numeric not null, -- Snapshot do preço
  quantidade integer not null
);

-- 5. FINANCEIRO
create table public.financeiro (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  data timestamp with time zone default timezone('utc'::text, now()) not null,
  tipo text check (tipo in ('entrada', 'saida')) not null,
  categoria text,
  descricao text,
  valor numeric not null
);

-- Enable Row Level Security (RLS)
-- This secures your data so only authenticated users can access it
alter table public.produtos enable row level security;
alter table public.clientes enable row level security;
alter table public.vendas enable row level security;
alter table public.itens_venda enable row level security;
alter table public.financeiro enable row level security;

-- Create Policies (Allow read/write for authenticated users)
create policy "Enable all for authenticated users" on public.produtos for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.clientes for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.vendas for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.itens_venda for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.financeiro for all using (auth.role() = 'authenticated');

-- RPC for Atomic Sales Transaction
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
    -- Decrease Stock (Atomic)
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
  insert into public.financeiro (tipo, categoria, descricao, valor, data)
  values (
    'entrada',
    'Vendas',
    'Venda #' || left(v_venda_id::text, 8),
    (p_venda->>'valor_total')::numeric,
    v_created_at
  );

  return jsonb_build_object('id', v_venda_id, 'created_at', v_created_at);
end;
$$;
