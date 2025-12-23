-- MIGRATION: ADD PARCELAS & UPDATE SALES LOGIC

-- 1. Create 'parcelas' Table
create table if not exists public.parcelas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  venda_id uuid references public.vendas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id), -- Denormalized for easier querying
  numero_parcela integer not null, -- 1, 2, 3...
  valor_parcela numeric not null,
  data_vencimento date not null,
  data_pagamento date, -- Null if not paid
  status text default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'parcial')),
  metodo_pagamento text -- 'boleto', 'pix', 'cartao', etc. (optional for individual installments)
);

-- RLS
alter table public.parcelas enable row level security;
drop policy if exists "Enable all for authenticated users" on public.parcelas;
create policy "Enable all for authenticated users" on public.parcelas for all using (auth.role() = 'authenticated');


-- 2. Update 'finalizar_venda' Function
-- Now accepts 'p_parcelas' array
drop function if exists finalizar_venda(jsonb, jsonb);

create or replace function finalizar_venda(
  p_venda jsonb,
  p_itens jsonb,
  p_parcelas jsonb default '[]'::jsonb -- Array of { numero, valor, vencimento }
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_venda_id uuid;
  v_item jsonb;
  v_parcela jsonb;
  v_created_at timestamp with time zone;
begin
  -- Set context for trigger so it knows this is a SALE
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
    -- Decrease Stock (fires trigger)
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

  -- 3. Process Installments (Parcelas) OR Single Entry
  -- If installments are provided, use them.
  -- If not (e.g., full payment cash/pix), create a single "paid" installment or just financial entry?
  -- STRATEGY: 
  -- IF p_parcelas is NOT empty:
  --    Insert into parcelas.
  --    Also insert "Entry" (down payment) into financeiro IF exists? 
  --    Actually, usually the frontend passes ALL installments.
  --    If it's immediate payment (Cash), it might be 1 installment passed as "Paid"?
  --    Let's rely on frontend to pass correct status.
  
  if jsonb_array_length(p_parcelas) > 0 then
      for v_parcela in select * from jsonb_array_elements(p_parcelas)
      loop
        insert into public.parcelas (venda_id, cliente_id, numero_parcela, valor_parcela, data_vencimento, data_pagamento, status)
        values (
            v_venda_id,
            (p_venda->>'cliente_id')::uuid,
            (v_parcela->>'numero_parcela')::int,
            (v_parcela->>'valor_parcela')::numeric,
            (v_parcela->>'data_vencimento')::date,
            case when (v_parcela->>'status') = 'pago' then v_created_at::date else null end, -- If status is paid, set date
            coalesce(v_parcela->>'status', 'pendente')
        );

        -- If this specific installment is PAID (e.g. entry), add to financeiro flow immediately?
        -- OR, we just add the "Total Paid" amount to financeiro as a single entry for the sale context?
        -- Let's stick to the existing logic: Add "Entry" or "Total Paid" to Financeiro.
      end loop;
  end if;

  -- 4. Add to Financeiro (Cash Flow)
  -- Only add what was ACTUALLY received (valor_pago).
  -- If full payment, valor_pago = valor_total.
  -- If partial, valor_pago = entry.
  if (p_venda->>'valor_pago')::numeric > 0 then
      insert into public.financeiro (tipo, categoria, descricao, valor, data, venda_id)
      values (
        'entrada',
        'Vendas',
        'Venda #' || left(v_venda_id::text, 8) || ' (Recebido)',
        (p_venda->>'valor_pago')::numeric,
        v_created_at,
        v_venda_id
      );
  end if;

  return jsonb_build_object('id', v_venda_id, 'created_at', v_created_at);
end;
$$;
