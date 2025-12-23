/* SCRIPT DE NOVA REMESSA - FORMATO MISTO */
do $$
declare
    v_id uuid;
begin

    -- Item: Sabonete de rosto- espumante
    select id into v_id from public.produtos where lower(nome) = lower('Sabonete de rosto- espumante') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Sabonete de rosto- espumante', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Sabonete de rosto esfoliante- poran
    select id into v_id from public.produtos where lower(nome) = lower('Sabonete de rosto esfoliante- poran') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Sabonete de rosto esfoliante- poran', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Sabonete de rosto- manchas- poran
    select id into v_id from public.produtos where lower(nome) = lower('Sabonete de rosto- manchas- poran') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Sabonete de rosto- manchas- poran', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Blush em bastão- Febella
    select id into v_id from public.produtos where lower(nome) = lower('Blush em bastão- Febella') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Blush em bastão- Febella', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Blush bastão- dapop
    select id into v_id from public.produtos where lower(nome) = lower('Blush bastão- dapop') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Blush bastão- dapop', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Contorno em bastão- dapop
    select id into v_id from public.produtos where lower(nome) = lower('Contorno em bastão- dapop') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Contorno em bastão- dapop', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Água micelar- max love
    select id into v_id from public.produtos where lower(nome) = lower('Água micelar- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Água micelar- max love', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Sabonete intímo
    select id into v_id from public.produtos where lower(nome) = lower('Sabonete intímo') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Sabonete intímo', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Serum- controle de oleosidade
    select id into v_id from public.produtos where lower(nome) = lower('Serum- controle de oleosidade') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Serum- controle de oleosidade', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Serum- fixador de maquiagem
    select id into v_id from public.produtos where lower(nome) = lower('Serum- fixador de maquiagem') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Serum- fixador de maquiagem', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Serum- manchas
    select id into v_id from public.produtos where lower(nome) = lower('Serum- manchas') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Serum- manchas', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Sombra para sombrancelha
    select id into v_id from public.produtos where lower(nome) = lower('Sombra para sombrancelha') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Sombra para sombrancelha', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Pó compacto- p30
    select id into v_id from public.produtos where lower(nome) = lower('Pó compacto- p30') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Pó compacto- p30', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Pó compacto- p10
    select id into v_id from public.produtos where lower(nome) = lower('Pó compacto- p10') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Pó compacto- p10', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Pó compacto- max love
    select id into v_id from public.produtos where lower(nome) = lower('Pó compacto- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Pó compacto- max love', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Pó translucido
    select id into v_id from public.produtos where lower(nome) = lower('Pó translucido') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Pó translucido', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Pó trasluscido
    select id into v_id from public.produtos where lower(nome) = lower('Pó trasluscido') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Pó trasluscido', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Corretivo
    select id into v_id from public.produtos where lower(nome) = lower('Corretivo') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Corretivo', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Fixador de sombrancelha
    select id into v_id from public.produtos where lower(nome) = lower('Fixador de sombrancelha') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Fixador de sombrancelha', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Blush- mahav
    select id into v_id from public.produtos where lower(nome) = lower('Blush- mahav') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Blush- mahav', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Iluminador
    select id into v_id from public.produtos where lower(nome) = lower('Iluminador') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Iluminador', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Gloss labial infantil- vivai
    select id into v_id from public.produtos where lower(nome) = lower('Gloss labial infantil- vivai') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 3
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 3, qtd, 3, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gloss labial infantil- vivai', 3, 20, 35, 'Cosméticos');
    end if;

    -- Item: Gloss lip- max love
    select id into v_id from public.produtos where lower(nome) = lower('Gloss lip- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gloss lip- max love', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Gloss com acido hialurônico
    select id into v_id from public.produtos where lower(nome) = lower('Gloss com acido hialurônico') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gloss com acido hialurônico', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Rimel Melu
    select id into v_id from public.produtos where lower(nome) = lower('Rimel Melu') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Rimel Melu', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Rimel- Febella
    select id into v_id from public.produtos where lower(nome) = lower('Rimel- Febella') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Rimel- Febella', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Gloss- mia make
    select id into v_id from public.produtos where lower(nome) = lower('Gloss- mia make') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gloss- mia make', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Gloss nelo mel
    select id into v_id from public.produtos where lower(nome) = lower('Gloss nelo mel') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gloss nelo mel', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Lip Glow
    select id into v_id from public.produtos where lower(nome) = lower('Lip Glow') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Lip Glow', 2, 20, 35, 'Cosméticos');
    end if;

    -- Item: Gel aromatizante
    select id into v_id from public.produtos where lower(nome) = lower('Gel aromatizante') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gel aromatizante', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Oleo corporal
    select id into v_id from public.produtos where lower(nome) = lower('Oleo corporal') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 20
            , preco_venda = 35
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Oleo corporal', 1, 20, 35, 'Cosméticos');
    end if;

    -- Item: Pente polvo
    select id into v_id from public.produtos where lower(nome) = lower('Pente polvo') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 6
            , custo = 3.35
            , preco_venda = 10
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 6, qtd, 6, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Pente polvo', 6, 3.35, 10, 'Cosméticos');
    end if;

    -- Item: Serum- max love
    select id into v_id from public.produtos where lower(nome) = lower('Serum- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 6
            , custo = 8
            , preco_venda = 20
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 6, qtd, 6, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Serum- max love', 6, 8, 20, 'Cosméticos');
    end if;

    -- Item: Paleta de contorno- max love
    select id into v_id from public.produtos where lower(nome) = lower('Paleta de contorno- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 10
            , preco_venda = 25
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Paleta de contorno- max love', 2, 10, 25, 'Cosméticos');
    end if;

    -- Item: Balm hidrantante teen Mia
    select id into v_id from public.produtos where lower(nome) = lower('Balm hidrantante teen Mia') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 6
            , custo = 4.66
            , preco_venda = 12
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 6, qtd, 6, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Balm hidrantante teen Mia', 6, 4.66, 12, 'Cosméticos');
    end if;

    -- Item: Delineador
    select id into v_id from public.produtos where lower(nome) = lower('Delineador') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 7
            , preco_venda = 12
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Delineador', 2, 7, 12, 'Cosméticos');
    end if;

    -- Item: Base liquída
    select id into v_id from public.produtos where lower(nome) = lower('Base liquída') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 6
            , custo = 15.33
            , preco_venda = 30
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 6, qtd, 6, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Base liquída', 6, 15.33, 30, 'Cosméticos');
    end if;

    -- Item: Esponjinha de maquiagem
    select id into v_id from public.produtos where lower(nome) = lower('Esponjinha de maquiagem') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 12
            , custo = 2.08
            , preco_venda = 5
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 12, qtd, 12, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Esponjinha de maquiagem', 12, 2.08, 5, 'Cosméticos');
    end if;

    -- Item: Liptint max love
    select id into v_id from public.produtos where lower(nome) = lower('Liptint max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 6
            , preco_venda = 10
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Liptint max love', 2, 6, 10, 'Cosméticos');
    end if;

    -- Item: Escova de limpeza facial
    select id into v_id from public.produtos where lower(nome) = lower('Escova de limpeza facial') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 8.99
            , preco_venda = 20
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Escova de limpeza facial', 2, 8.99, 20, 'Cosméticos');
    end if;

    -- Item: Gloss Lip volumoso- max love
    select id into v_id from public.produtos where lower(nome) = lower('Gloss Lip volumoso- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 2
            , custo = 8
            , preco_venda = 15
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 2, qtd, 2, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Gloss Lip volumoso- max love', 2, 8, 15, 'Cosméticos');
    end if;

    -- Item: Lip Balm de Mel
    select id into v_id from public.produtos where lower(nome) = lower('Lip Balm de Mel') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 8.99
            , preco_venda = 20
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Lip Balm de Mel', 1, 8.99, 20, 'Cosméticos');
    end if;

    -- Item: Blush Isis make
    select id into v_id from public.produtos where lower(nome) = lower('Blush Isis make') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 4
            , custo = 6.5
            , preco_venda = 15
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 4, qtd, 4, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Blush Isis make', 4, 6.5, 15, 'Cosméticos');
    end if;

    -- Item: Esfoliante facial- max love
    select id into v_id from public.produtos where lower(nome) = lower('Esfoliante facial- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 1
            , custo = 7.49
            , preco_venda = 18
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 1, qtd, 1, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Esfoliante facial- max love', 1, 7.49, 18, 'Cosméticos');
    end if;

    -- Item: Lip Oil- max love
    select id into v_id from public.produtos where lower(nome) = lower('Lip Oil- max love') limit 1;
    if v_id is not null then
        -- UPDATE
        update public.produtos set 
            qtd = qtd + 3
            , custo = 7.99
            , preco_venda = 20
        where id = v_id;
        -- Log
        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
        select id, qtd - 3, qtd, 3, 'entrada_nova_remessa' from public.produtos where id = v_id;
    else
        -- INSERT
        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)
        values ('Lip Oil- max love', 3, 7.99, 20, 'Cosméticos');
    end if;
end $$;
