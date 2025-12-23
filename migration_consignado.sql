-- 1. Add Consignment Columns to itens_venda
alter table public.itens_venda add column if not exists preco_custo numeric(10,2) default 0;
alter table public.itens_venda add column if not exists consignado_pago boolean default false;
alter table public.itens_venda add column if not exists categoria_produto text;

-- 2. Update finalizar_venda Function
create or replace function finalizar_venda(
    p_venda_id uuid,
    p_valor_total numeric,
    p_metodo_pagamento text,
    p_cliente_id uuid,
    p_itens jsonb,
    p_desconto numeric default 0,
    p_valor_pago numeric default null,       
    p_data_vencimento date default null,      
    p_status_pagamento text default 'pago'     
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_item jsonb;
    v_produto_id uuid;
    v_qtd integer;
    v_preco numeric;
    v_estoque_atual integer;
    
    -- New variables for consignment
    v_custo numeric;
    v_categoria text;
    
    v_venda_id uuid;
    v_final_valor_pago numeric;
begin
    -- Set default valor_pago
    if p_valor_pago is null then
        v_final_valor_pago := p_valor_total;
    else
        v_final_valor_pago := p_valor_pago;
    end if;

    -- 1. Create Sale Record
    insert into public.vendas (
        id, 
        valor_total, 
        metodo_pagamento, 
        cliente_id, 
        desconto,
        valor_pago,
        data_vencimento,
        status_pagamento,
        created_at
    )
    values (
        coalesce(p_venda_id, gen_random_uuid()), 
        p_valor_total,
        p_metodo_pagamento,
        p_cliente_id,
        coalesce(p_desconto, 0),
        v_final_valor_pago,
        p_data_vencimento,
        p_status_pagamento,
        now()
    )
    returning id into v_venda_id;

    -- 2. Process Items
    for v_item in select * from jsonb_array_elements(p_itens)
    loop
        v_produto_id := (v_item->>'produto_id')::uuid;
        v_qtd := (v_item->>'quantidade')::integer;
        v_preco := (v_item->>'preco_unitario')::numeric;

        -- Get Stock AND Cost/Category
        select qtd, custo, categoria 
        into v_estoque_atual, v_custo, v_categoria
        from public.produtos 
        where id = v_produto_id;
        
        if v_estoque_atual < v_qtd then
            raise exception 'Estoque insuficiente para o produto %', (v_item->>'nome');
        end if;

        -- Deduct Stock
        update public.produtos
        set qtd = qtd - v_qtd
        where id = v_produto_id;

        -- Record Item (with Cost and Category snapshots)
        insert into public.itens_venda (
            venda_id, 
            produto_id, 
            nome_produto, 
            preco_unitario, 
            quantidade,
            preco_custo,        -- NEW
            categoria_produto   -- NEW
        )
        values (
            v_venda_id, 
            v_produto_id, 
            v_item->>'nome', 
            v_preco, 
            v_qtd,
            coalesce(v_custo, 0),        -- Snapshot cost
            coalesce(v_categoria, '')    -- Snapshot category
        );
    end loop;

    return jsonb_build_object(
        'success', true, 
        'venda_id', v_venda_id,
        'message', 'Venda finalizada com sucesso'
    );
exception
    when others then
        return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
