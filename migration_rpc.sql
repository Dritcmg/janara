-- RUN THIS SQL IN SUPABASE SQL EDITOR
-- This creates the function to secure sales transactions

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
