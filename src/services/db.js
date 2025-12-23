
import { supabase } from './supabaseClient';

export const db = {
  // CLIENTS
  clients: {
    list: async () => {
      const { data, error } = await supabase.from('clientes').select('*').order('nome');
      if (error) throw error;
      return data || [];
    },
    add: async (client) => {
      const { data, error } = await supabase.from('clientes').insert([client]).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    getHistory: async (clientId) => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  },

  // PRODUCTS
  products: {
    list: async (params) => {
      // If no params, return all (backward compatibility for Sales.jsx)
      if (!params) {
        const { data, error } = await supabase.from('produtos').select('*').order('nome');
        if (error) throw error;
        return Array.isArray(data) ? data : [];
      }

      // Pagination Mode
      const { page = 1, limit = 20, search = '' } = params;
      let query = supabase.from('produtos').select('*', { count: 'exact' });

      if (search) {
        query = query.or(`nome.ilike.%${search}%,categoria.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('nome')
        .range(from, to);

      if (error) throw error;
      return { data: data || [], count };
    },
    get: async (id) => {
      const { data, error } = await supabase.from('produtos').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    add: async (product) => {
      const { data, error } = await supabase.from('produtos').insert([product]).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('produtos').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    decreaseStock: async (id, quantity) => {
      // Get current stock first to ensure safety, or use RPC if concurrency is high.
      // For MVP, simple read-modify-write is okay, but ideally we'd use an rpc.
      const { data: product, error: getError } = await supabase.from('produtos').select('qtd').eq('id', id).single();
      if (getError) throw getError;

      const newQty = Math.max(0, product.qtd - quantity);
      const { error: updateError } = await supabase.from('produtos').update({ qtd: newQty }).eq('id', id);
      if (updateError) throw updateError;
    },
    uploadImage: async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('produtos').getPublicUrl(filePath);
      return data.publicUrl;
    }
  },

  // SALES & POS
  sales: {
    create: async (saleData, items) => {
      // Use RPC for atomic transaction
      const { data, error } = await supabase.rpc('finalizar_venda', {
        p_venda: saleData,
        p_itens: items
      });

      if (error) throw error;
      return data;
    },
    list: async () => {
      const { data, error } = await supabase.from('vendas').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  },

  // FINANCIAL
  financial: {
    list: async (params = {}) => {
      let query = supabase.from('financeiro').select('*').order('data', { ascending: false });

      if (params.startDate) {
        query = query.gte('data', params.startDate);
      }
      if (params.endDate) {
        // Adjust end date to cover the entire day (23:59:59)
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('data', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    add: async (entry) => {
      // Prepare entry to match schema (remove id/created_at if passed, let DB handle)
      const { id, created_at, ...entryData } = entry;
      const { data, error } = await supabase.from('financeiro').insert([entryData]).select().single();
      if (error) throw error;
      return data;
    },
    getSummary: async () => {
      // Optimization: Fetch only this month's data + today's data.
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data: monthData, error } = await supabase
        .from('financeiro')
        .select('*')
        .gte('data', startOfMonth);

      if (error) throw error;

      const safeData = monthData || [];

      const salesToday = safeData
        .filter(f => f.tipo === 'entrada' && f.data.startsWith(today))
        .reduce((sum, f) => sum + f.valor, 0);

      const incomeMonth = safeData
        .filter(f => f.tipo === 'entrada')
        .reduce((sum, f) => sum + f.valor, 0);

      const expenseMonth = safeData
        .filter(f => f.tipo === 'saida')
        .reduce((sum, f) => sum + f.valor, 0);

      return {
        todaySales: salesToday,
        monthProfit: incomeMonth - expenseMonth,
        monthRevenue: incomeMonth,
        monthExpenses: expenseMonth
      };
    },
    getByCategory: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: expenses, error } = await supabase
        .from('financeiro')
        .select('*')
        .eq('tipo', 'saida')
        .gte('data', startOfMonth);

      if (error) throw error;

      const categoryMap = {};
      (expenses || []).forEach(e => {
        const cat = e.categoria || 'Outros';
        categoryMap[cat] = (categoryMap[cat] || 0) + e.valor;
      });

      return categoryMap;
    },

    // ANALYTICS METHODS
    getSalesLast7Days: async () => {
      const today = new Date();
      const last7Days = new Date(today);
      last7Days.setDate(today.getDate() - 6);
      last7Days.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('vendas')
        .select('created_at, valor_total')
        .gte('created_at', last7Days.toISOString());

      if (error) throw error;

      // Initialize last 7 days map
      const daysMap = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(last7Days);
        d.setDate(last7Days.getDate() + i);
        const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        daysMap[dayStr] = 0;
      }

      // Aggregate
      (data || []).forEach(venda => {
        const date = new Date(venda.created_at);
        const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        if (daysMap[dayStr] !== undefined) {
          daysMap[dayStr] += venda.valor_total;
        }
      });

      return Object.entries(daysMap).map(([name, value]) => ({ name, value }));
    },

    getSalesByPaymentMethod: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from('vendas')
        .select('metodo_pagamento, valor_total')
        .gte('created_at', startOfMonth);

      if (error) throw error;

      const methodMap = {};
      (data || []).forEach(v => {
        const method = v.metodo_pagamento || 'Outros';
        // Capitalize
        const formatted = method.charAt(0).toUpperCase() + method.slice(1);
        methodMap[formatted] = (methodMap[formatted] || 0) + v.valor_total;
      });

      // Convert to array for Recharts
      return Object.entries(methodMap).map(([name, value]) => ({ name, value }));
    },

    getSalesByCategory: async () => {
      // Need to join via iten_venda or fetch items -> product -> category
      // Assuming we want current month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Fetch items from sales this month. 
      // NOTE: standard supabase select on standard tables (not joined via foreign key if not set up as such in js sdk easily)
      // We will fetch sales then related items then products? Easier to fetch sales items directly if we had a date there.
      // sales items don't have date. We have 'venda_id'. 

      // Let's do a join query if possible or 2 steps.
      // Step 1: Get sale IDs for this month
      const { data: sales, error: salesError } = await supabase.from('vendas').select('id').gte('created_at', startOfMonth);
      if (salesError) throw salesError;
      if (!sales || sales.length === 0) return [];

      const saleIds = sales.map(s => s.id);

      // Step 2: Get items for these sales
      const { data: items, error: itemsError } = await supabase
        .from('itens_venda')
        .select('quantidade, produto_id') // We need to know category. Usually snapshot name doesn't have it.
        .in('venda_id', saleIds);

      if (itemsError) throw itemsError;

      // Step 3: Get products details for categories
      // Optimization: Get all products once or just unique IDs
      const uniqueProductIds = [...new Set(items.map(i => i.produto_id))];
      const { data: products, error: prodError } = await supabase
        .from('produtos')
        .select('id, categoria')
        .in('id', uniqueProductIds);

      if (prodError) throw prodError;

      const productCategoryMap = {};
      products.forEach(p => productCategoryMap[p.id] = p.categoria || 'Sem Categoria');

      const categoryStats = {};
      items.forEach(item => {
        const cat = productCategoryMap[item.produto_id];
        if (cat) {
          categoryStats[cat] = (categoryStats[cat] || 0) + item.quantidade;
        }
      });

      return Object.entries(categoryStats).map(([name, value]) => ({ name, value }));
    }
  }
};
