-- 1. Restore itens_venda table if missing
create table if not exists public.itens_venda (
    id uuid default gen_random_uuid() primary key,
    venda_id uuid references public.vendas(id) on delete cascade,
    produto_id uuid references public.produtos(id),
    nome_produto text not null,
    quantidade integer not null,
    preco_unitario numeric(10,2) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.itens_venda enable row level security;

-- Create policy for itens_venda
drop policy if exists "Enable all for authenticated users" on public.itens_venda;
create policy "Enable all for authenticated users" on public.itens_venda for all using (auth.role() = 'authenticated');

-- 2. Add Partial Payment columns to vendas table
alter table public.vendas add column if not exists valor_pago numeric(10,2) default 0;
alter table public.vendas add column if not exists status_pagamento text default 'pago'; -- 'pago', 'pendente', 'parcial'
alter table public.vendas add column if not exists os_referencia text;
alter table public.vendas add column if not exists data_vencimento date;
alter table public.vendas add column if not exists cliente_nome_temp text; -- useful for quick non-registered sales if needed

-- 3. Restore/Update finalizar_venda Function
create or replace function finalizar_venda(
    p_venda_id uuid,
    p_valor_total numeric,
    p_metodo_pagamento text,
    p_cliente_id uuid,
    p_itens jsonb,
    p_desconto numeric default 0,
    p_valor_pago numeric default null,         -- NEW
    p_data_vencimento date default null,       -- NEW
    p_status_pagamento text default 'pago'     -- NEW
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
    v_venda_id uuid;
    v_final_valor_pago numeric;
begin
    -- Set default valor_pago to total if null (backward compatibility)
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
        coalesce(p_venda_id, gen_random_uuid()), -- Use provided ID or generate new
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

        -- Check Stock
        select qtd into v_estoque_atual from public.produtos where id = v_produto_id;
        
        if v_estoque_atual < v_qtd then
            raise exception 'Estoque insuficiente para o produto %', (v_item->>'nome');
        end if;

        -- Deduct Stock
        update public.produtos
        set qtd = qtd - v_qtd
        where id = v_produto_id;

        -- Record Item
        insert into public.itens_venda (venda_id, produto_id, nome_produto, preco_unitario, quantidade)
        values (v_venda_id, v_produto_id, v_item->>'nome', v_preco, v_qtd);
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
