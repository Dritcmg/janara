-- Migration: Mobile Optimization (Triggers)

-- 1. Create or Replace Trigger Function
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

-- 2. Create Trigger on produtos
drop trigger if exists tr_log_stock_change on public.produtos;
create trigger tr_log_stock_change
after update on public.produtos
for each row
execute function public.fn_log_stock_change();

-- 3. Update RPC to REMOVE manual logging and SET context
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
    -- Decrease Stock (The Trigger will now catch this!)
    update public.produtos
    set qtd = qtd - (v_item->>'quantidade')::int
    where id = (v_item->>'produto_id')::uuid;

    -- WE DO NOT MANUALLY INSERT INTO movimentacoes_estoque HERE ANYMORE

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
