
import fs from 'fs';
import path from 'path';

const rawDataPath = path.join(process.cwd(), 'raw_data_new.txt');
const outputPath = path.join(process.cwd(), 'upsert_stock_v2.sql');

if (!fs.existsSync(rawDataPath)) {
    console.error("raw_data_new.txt not found.");
    process.exit(1);
}

const rawData = fs.readFileSync(rawDataPath, 'utf8');
const lines = rawData.split('\n').filter(l => l.trim().length > 0);

// Product Map to Aggregate Duplicates
// Key: Normalized Name
// Value: { name, qty, cost, price }
const productMap = new Map();

function cleanPrice(p) {
    if (!p) return 0;
    // Remove "R$" and spaces, replace comma with dot
    let clean = p.replace(/R\$\s*/g, '').trim();
    clean = clean.replace(/\./g, ''); // Remove thousands separator if any? Usually in BR format dot is thousands, comma is decimal.
    // Wait, simple regex: replace everything not digit or comma.
    // Actually, "20,00" -> 20.00
    // "1.200,00" -> 1200.00
    // Let's assume standard PT-BR loose format.
    clean = clean.replace(/[^\d,]/g, '');
    clean = clean.replace(',', '.');
    return parseFloat(clean) || 0;
}

let mode = 'SECTION_1'; // Start with assumption of first format

lines.forEach(line => {
    const lowerLine = line.toLowerCase();

    // Detect Mode Switching or Header skipping
    if (line.includes('DESCRIÇÃO') && line.includes('ESTOQUE COMPRADO')) {
        mode = 'SECTION_1';
        return;
    }
    if (line.includes('MAQUIAGENS') || (line.includes('DESCRIÇÃO') && line.includes('PREÇO UNITÁRIO'))) {
        mode = 'SECTION_2';
        return;
    }
    if (line.includes('PAGAMENTO ATÉ')) return;

    // Parse based on mode
    // Split by multiple spaces or tabs
    const parts = line.split(/\t+/).map(s => s.trim()).filter(s => s.length > 0);

    if (parts.length < 2) return; // Not enough data

    let name, qty, cost, price;

    if (mode === 'SECTION_1') {
        // Format: DESCRIÇÃO | ESTOQUE COMPRADO | PREÇO CUSTO | PREÇO DE VENDA | ...
        // Example: Sabonete de rosto- espumante | 1 | 20,00 | 35,00 ...
        // Index 0: Name
        // Index 1: Qty
        // Index 2: Cost
        // Index 3: Price

        name = parts[0];
        // Sometimes parsing splitting might be tricky if tabs are inconsistent.
        // Assuming strict column order found in parts.

        // If parts[1] is empty or not number, check usage.
        qty = parseInt(parts[1]);
        cost = cleanPrice(parts[2]);
        price = cleanPrice(parts[3]);

    } else {
        // Format: DESCRIÇÃO | QTD | PREÇO UNITÁRIO | PREÇO ATACADO | PREÇO VENDA UNI. | ...
        // Example: Pente polvo | 6 | R$ 3,35 | R$ 20,10 | R$ 10,00 ...
        // Index 0: Name
        // Index 1: Qty
        // Index 2: Unit Cost
        // Index 3: ...
        // Index 4: Unit Sale Price

        name = parts[0];
        qty = parseInt(parts[1]);
        cost = cleanPrice(parts[2]);
        // index 3 is total cost or wholesale price? "PREÇO ATACADO" usually wholesale.
        // index 4 is "PREÇO VENDA UNI."
        price = cleanPrice(parts[4]);
    }

    if (name && !isNaN(qty)) {
        const key = name.toLowerCase().trim();
        if (productMap.has(key)) {
            const existing = productMap.get(key);
            existing.qty += qty;
            // Update cost/price to latest? Or average? 
            // Lets keep latest line's cost/price as source of truth
            existing.cost = cost || existing.cost;
            existing.price = price || existing.price;
        } else {
            productMap.set(key, { name, qty, cost, price });
        }
    }
});

// Generate SQL
let sql = `/* SCRIPT DE NOVA REMESSA - FORMATO MISTO */\n`;
sql += `do $$\n`;
sql += `declare\n`;
sql += `    v_id uuid;\n`;
sql += `begin\n`;

for (const p of productMap.values()) {
    const safeStr = (s) => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';

    sql += `\n    -- Item: ${p.name}\n`;
    sql += `    select id into v_id from public.produtos where lower(nome) = lower(${safeStr(p.name)}) limit 1;\n`;

    sql += `    if v_id is not null then\n`;
    sql += `        -- UPDATE\n`;
    sql += `        update public.produtos set \n`;
    sql += `            qtd = qtd + ${p.qty}\n`;
    if (p.cost > 0) sql += `            , custo = ${p.cost}\n`;
    if (p.price > 0) sql += `            , preco_venda = ${p.price}\n`;
    sql += `        where id = v_id;\n`;

    sql += `        -- Log\n`;
    sql += `        insert into public.movimentacoes_estoque (produto_id, quantidade_anterior, quantidade_nova, quantidade_alterada, motivo)\n`;
    sql += `        select id, qtd - ${p.qty}, qtd, ${p.qty}, 'entrada_nova_remessa' from public.produtos where id = v_id;\n`;

    sql += `    else\n`;
    sql += `        -- INSERT\n`;
    sql += `        insert into public.produtos (nome, qtd, custo, preco_venda, categoria)\n`;
    sql += `        values (${safeStr(p.name)}, ${p.qty}, ${p.cost || 0}, ${p.price || 0}, 'Cosméticos');\n`; // Assuming cosmetics based on data
    sql += `    end if;\n`;
}

sql += `end $$;\n`;

fs.writeFileSync(outputPath, sql);
console.log(`Generated SQL for ${productMap.size} unique items.`);
