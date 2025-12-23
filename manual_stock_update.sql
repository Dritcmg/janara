-- TEMPLATE PARA ATUALIZAÇÃO MANUAL DE ESTOQUE (VIDE NOTAS FISCAIS)
-- Copie este script, preencha os produtos e quantidades na seção indicada abaixo, e rode no Editor SQL do Supabase.

do $$
declare
    v_produto record;
    v_item record;
    v_missing_products text[] := '{}';
begin
    -- 1. CRIAÇÃO DE TABELA TEMPORÁRIA PARA OS ITENS DA NOTA
    -- Preencha aqui os nomes EXATOS como estão no banco e a quantidade a ADICIONAR
    create temp table itens_nota (nome_produto text, qtd_entrada integer) on commit drop;
    
    insert into itens_nota (nome_produto, qtd_entrada) values
    -- ==================================================================================
    -- ADICIONE SEUS ITENS AQUI (Mantenha o formato: 'Nome', Quantidade)
    -- Exemplo:
    -- ('Camiseta Básica P', 10),
    -- ('Calça Jeans 38', 5)
    
    ('Nome do Produto 1', 10),  -- <--- SUBSTITUA
    ('Nome do Produto 2', 5);   -- <--- SUBSTITUA
    
    -- ==================================================================================

    -- 2. PROCESSAMENTO
    for v_item in select * from itens_nota loop
        
        -- Busca o produto pelo nome (case insensitive para facilitar)
        select * into v_produto from public.produtos 
        where lower(nome) = lower(v_item.nome_produto)
        limit 1;

        if v_produto.id is not null then
            -- A. Atualiza Estoque
            update public.produtos
            set qtd = qtd + v_item.qtd_entrada
            where id = v_produto.id;
            
            -- B. Registra Movimentação (Auditoria)
            insert into public.movimentacoes_estoque 
            (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)
            values (
                v_produto.id,
                v_produto.qtd, -- qtd anterior (snapshot é aproximado pois o update já rodou, mas ok para log manual)
                v_produto.qtd + v_item.qtd_entrada,
                v_item.qtd_entrada,
                'entrada_fornecedor' -- Motivo fixo para notas fiscais
            );
            
            raise notice 'Estoque atualizado: % (+%)', v_produto.nome, v_item.qtd_entrada;
        else
            -- Produto não encontrado
            v_missing_products := array_append(v_missing_products, v_item.nome_produto);
            raise notice 'ALERTA: Produto não encontrado: %', v_item.nome_produto;
        end if;
    end loop;

    -- 3. RELATÓRIO FINAL
    if array_length(v_missing_products, 1) > 0 then
        raise notice '---------------------------------------------------';
        raise notice 'ATENÇÃO: Os seguintes produtos NÃO foram encontrados:';
        foreach v_missing_products in array v_missing_products loop
             raise notice '- %', v_missing_products;
        end loop;
        raise notice 'Verifique a grafia ou cadastre-os antes de rodar novamente.';
    else
        raise notice 'Sucesso! Todos os produtos foram atualizados.';
    end if;

end $$;
