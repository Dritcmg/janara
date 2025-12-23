import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { ArrowUpCircle, ArrowDownCircle, Plus, PieChart, Wallet, Clock, MessageCircle, AlertCircle, ShoppingBag, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { formatCurrency, parseCurrency } from '../lib/utils';

const Financial = () => {
    const [transactions, setTransactions] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [consignments, setConsignments] = useState([]); // NEW: Consignment Items
    const [expenseStats, setExpenseStats] = useState({});
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'consignado'
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        descricao: '',
        categoria: 'Operacional',
        valor: ''
    });

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Transactions
            const data = await db.financial.list(dateRange);
            setTransactions(data);

            // 2. Stats
            const stats = await db.financial.getByCategory();
            setExpenseStats(stats);

            // 3. Receivables
            const { data: pendingSales } = await supabase
                .from('vendas')
                .select(`
                    id, created_at, valor_total, valor_pago, status_pagamento, data_vencimento, 
                    cliente_nome_temp, clientes (nome, telefone)
                `)
                .or('status_pagamento.eq.pendente,status_pagamento.eq.parcial')
                .order('data_vencimento', { ascending: true });

            const today = new Date().toISOString().split('T')[0];
            const sortedReceivables = (pendingSales || []).map(sale => {
                const total = parseFloat(sale.valor_total);
                const paid = parseFloat(sale.valor_pago || 0);
                const remaining = total - paid;
                const isOverdue = sale.data_vencimento && sale.data_vencimento < today;

                return {
                    ...sale,
                    remaining,
                    isOverdue,
                    clientName: sale.clientes?.nome || sale.cliente_nome_temp || 'Cliente'
                };
            });
            setReceivables(sortedReceivables);

            // 4. Consignments (Sold but not Paid to Supplier)
            // Note: DB Migration required for column 'consignado_pago' and 'preco_custo' on itens_venda
            // We use 'ilike' for category to be safe
            const { data: soldConsignments, error: consError } = await supabase
                .from('itens_venda')
                .select('*')
                .ilike('categoria_produto', '%Consignado%')
                .eq('consignado_pago', false)
                .order('created_at', { ascending: false });

            if (!consError) {
                setConsignments(soldConsignments || []);
            }

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.tipo === filter);

    const openModal = (prefill = null) => {
        if (prefill) {
            setExpenseForm(prefill);
        } else {
            setExpenseForm({ descricao: '', categoria: 'Outros', valor: '' });
        }
        setIsModalOpen(true);
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();

        if (!expenseForm.descricao || !expenseForm.valor) {
            toast.error("Preencha todos os campos");
            return;
        }

        const valor = typeof expenseForm.valor === 'string' ? parseCurrency(expenseForm.valor) : expenseForm.valor;
        if (valor <= 0) {
            toast.error("Valor deve ser positivo");
            return;
        }

        try {
            setLoading(true);
            await db.financial.add({
                tipo: 'saida',
                categoria: expenseForm.categoria,
                descricao: expenseForm.descricao,
                valor,
                data: new Date().toISOString()
            });

            // If this was a consignment batch payment, update the items
            if (expenseForm.isConsignmentBatch && expenseForm.itemIds?.length > 0) {
                await supabase
                    .from('itens_venda')
                    .update({ consignado_pago: true })
                    .in('id', expenseForm.itemIds);
                toast.success("Lote de consignado baixado com sucesso!");
            } else {
                toast.success("Despesa registrada!");
            }

            setIsModalOpen(false);
            await loadData();
        } catch (error) {
            toast.error("Erro: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'valor') {
            setExpenseForm(prev => ({ ...prev, [name]: formatCurrency(value) }));
        } else {
            setExpenseForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePayConsignmentBatch = () => {
        if (consignments.length === 0) return;

        const totalCost = consignments.reduce((sum, item) => sum + Number(item.preco_custo || 0), 0);
        const itemIds = consignments.map(i => i.id);
        const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });

        openModal({
            descricao: `Pagamento Consignados - ${currentMonth}`,
            categoria: 'Estoque',
            valor: formatCurrency(totalCost.toFixed(2)),
            isConsignmentBatch: true,
            itemIds
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-10">
            {loading && <LoadingSpinner />}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center">
                    <Wallet className="mr-2 h-6 w-6 text-indigo-600" />
                    Financeiro
                </h1>

                {/* Tabs */}
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('consignado')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'consignado' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Consignados
                        {consignments.length > 0 && <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs py-0.5 px-2 rounded-full">{consignments.length}</span>}
                    </button>
                </div>

                <Button onClick={() => openModal()} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="mr-2 h-5 w-5" />
                    Registrar Despesa
                </Button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Receivables Section */}
                    {receivables.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-orange-900 flex items-center">
                                    <Clock className="mr-2 h-5 w-5 text-orange-600" />
                                    Contas a Receber
                                </h2>
                            </div>
                            {/* ... Same Table as before ... */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restante</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {receivables.map((calc) => (
                                            <tr key={calc.id} className={calc.isOverdue ? 'bg-red-50' : ''}>
                                                <td className="px-6 py-4 text-sm font-medium">{new Date(calc.data_vencimento).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm">{calc.clientName}</td>
                                                <td className="px-6 py-4 text-sm text-right font-bold">{formatCurrency(calc.remaining.toFixed(2))}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        const phone = calc.clientes?.telefone?.replace(/\D/g, '');
                                                        if (phone) window.open(`https://wa.me/55${phone}?text=Olá ${calc.clientName}, falta pagar R$ ${calc.remaining.toFixed(2)}`, '_blank');
                                                    }}>Cobrar</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Standard Financial View */}
                    {/* ... Same Chart and Table code ... */}
                    <div className="mt-8 mb-8">
                        <h2 className="text-lg leading-6 font-medium text-zinc-900 mb-4 flex items-center">
                            <PieChart className="mr-2 h-5 w-5 text-zinc-500" /> Análise de Despesas
                        </h2>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {Object.entries(expenseStats).map(([cat, val]) => (
                                <div key={cat} className="bg-white shadow-sm rounded-xl p-4 border-l-4 border-red-500">
                                    <dt className="text-xs font-medium text-zinc-500 uppercase">{cat}</dt>
                                    <dd className="mt-1 text-lg font-bold text-zinc-900">{formatCurrency(val.toString())}</dd>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.data).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{t.descricao}</td>
                                        <td className={`px-6 py-4 text-sm font-bold ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.tipo === 'entrada' ? '+' : '-'} {formatCurrency(t.valor.toFixed(2))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'consignado' && (
                <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-50/30">
                        <div>
                            <h2 className="text-xl font-serif text-gray-900 flex items-center">
                                <ShoppingBag className="mr-2 h-6 w-6 text-indigo-600" />
                                Gestão de Consignados
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Itens vendidos da categoria "Consignado" pendentes de acerto com fornecedor.
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total a Pagar (Custo)</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(consignments.reduce((acc, item) => acc + Number(item.preco_custo || 0), 0).toFixed(2))}
                            </p>
                            <Button
                                size="sm"
                                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handlePayConsignmentBatch}
                                disabled={consignments.length === 0}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Fechar Lote e Pagar
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Venda</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Venda</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-indigo-600 uppercase tracking-wider bg-indigo-50">Preço Custo (A Pagar)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {consignments.length > 0 ? (
                                    consignments.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.nome_produto}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                {formatCurrency(Number(item.preco_unitario).toFixed(2))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700 text-right bg-indigo-50/30">
                                                {formatCurrency(Number(item.preco_custo).toFixed(2))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            <p className="text-base font-medium">Nenhum item consignado vendido pendente.</p>
                                            <p className="text-sm mt-1">Vendas da categoria "Consignado" aparecerão aqui.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Expense Modal (Reused) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={expenseForm.isConsignmentBatch ? "Confirmar Pagamento de Lote" : "Registrar Despesa"}
            >
                <form id="expenseForm" onSubmit={handleSaveExpense} className="space-y-4">
                    {expenseForm.isConsignmentBatch && (
                        <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 text-indigo-800 text-sm mb-4">
                            Este lançamento dará baixa em {consignments.length} itens da lista de consignados.
                        </div>
                    )}
                    <div>
                        <Input
                            label="Descrição"
                            name="descricao"
                            value={expenseForm.descricao}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
                            <select
                                name="categoria"
                                value={expenseForm.categoria}
                                onChange={handleFormChange}
                                className="block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="Estoque">Estoque</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Operacional">Operacional</option>
                                <option value="Pessoal">Pessoal</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <Input
                                label="Valor"
                                name="valor"
                                value={expenseForm.valor}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                    </div>
                </form>
                <div className="mt-5 sm:flex sm:flex-row-reverse gap-2">
                    <Button type="submit" form="expenseForm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {expenseForm.isConsignmentBatch ? "Confirmar Baixa" : "Salvar"}
                    </Button>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                        Cancelar
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Financial;
