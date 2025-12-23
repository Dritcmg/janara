import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { ArrowUpCircle, ArrowDownCircle, Plus, PieChart, Wallet, Clock, MessageCircle, AlertCircle, ShoppingBag, CheckCircle, ChevronDown, ChevronRight, Tag, CheckSquare } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { formatCurrency, parseCurrency } from '../lib/utils';

const Financial = () => {
    const [transactions, setTransactions] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [consignmentGroups, setConsignmentGroups] = useState({}); // Grouped by Brand
    const [expenseStats, setExpenseStats] = useState({});
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const [expandedBrands, setExpandedBrands] = useState({});

    // Modal
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

            // 3. Receivables (Installments from 'parcelas')
            const { data: installData, error: instError } = await supabase
                .from('parcelas')
                .select(`
                    id, venda_id, numero_parcela, valor_parcela, data_vencimento, status,
                    clientes (nome, telefone)
                `)
                .or('status.eq.pendente,status.eq.atrasado,status.eq.parcial')
                .order('data_vencimento', { ascending: true });

            if (instError) console.error("Error fetching installments:", instError);

            const today = new Date().toISOString().split('T')[0];
            const sortedReceivables = (installData || []).map(inst => {
                const isOverdue = inst.data_vencimento < today;
                return {
                    id: inst.id,
                    venda_id: inst.venda_id,
                    data_vencimento: inst.data_vencimento,
                    amount: parseFloat(inst.valor_parcela),
                    isOverdue,
                    clientName: inst.clientes?.nome || 'Cliente',
                    phone: inst.clientes?.telefone,
                    parcelNumber: inst.numero_parcela
                };
            });
            setReceivables(sortedReceivables);

            // 4. Consignments (Grouped by Brand)
            const { data: soldConsignments, error: consError } = await supabase
                .from('itens_venda')
                .select('*')
                .eq('is_consignado', true)
                .eq('consignado_pago', false)
                .order('created_at', { ascending: false });

            if (!consError && soldConsignments) {
                const groups = {};
                soldConsignments.forEach(item => {
                    const brand = item.marca || 'Sem Marca';
                    if (!groups[brand]) {
                        groups[brand] = { items: [], totalCost: 0 };
                    }
                    groups[brand].items.push(item);
                    groups[brand].totalCost += Number(item.preco_custo || 0);
                });
                setConsignmentGroups(groups);
            }

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBrand = (brand) => {
        setExpandedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
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
        const valor = typeof expenseForm.valor === 'string' ? parseCurrency(expenseForm.valor) : expenseForm.valor;

        try {
            setLoading(true);
            await db.financial.add({
                tipo: 'saida',
                categoria: expenseForm.categoria,
                descricao: expenseForm.descricao,
                valor,
                data: new Date().toISOString()
            });

            if (expenseForm.isConsignmentBatch && expenseForm.itemIds?.length > 0) {
                await supabase
                    .from('itens_venda')
                    .update({ consignado_pago: true })
                    .in('id', expenseForm.itemIds);
                toast.success("Pagamento de lote registrado!");
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

    const handlePayInstallment = async (inst) => {
        if (!window.confirm(`Confirmar recebimento de ${formatCurrency(inst.amount)} de ${inst.clientName}?`)) return;

        setLoading(true);
        try {
            // 1. Update Parcela Status
            const { error: upError } = await supabase
                .from('parcelas')
                .update({ status: 'pago', data_pagamento: new Date().toISOString() })
                .eq('id', inst.id);

            if (upError) throw upError;

            // 2. Add Entry to Financeiro
            await db.financial.add({
                tipo: 'entrada',
                categoria: 'Vendas',
                descricao: `Parc. ${inst.parcelNumber} - ${inst.clientName}`,
                valor: inst.amount,
                data: new Date().toISOString()
            });

            toast.success("Parcela recebida com sucesso!");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar recebimento.");
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

    const handlePayBrandBatch = (brand, group) => {
        const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
        openModal({
            descricao: `Repasse Consignado - ${brand} (${currentMonth})`,
            categoria: 'Estoque',
            valor: formatCurrency(group.totalCost.toFixed(2)),
            isConsignmentBatch: true,
            itemIds: group.items.map(i => i.id)
        });
    };

    const totalConsignmentsPending = Object.values(consignmentGroups).reduce((acc, g) => acc + g.items.length, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-10">
            {loading && <LoadingSpinner />}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center">
                    <Wallet className="mr-2 h-6 w-6 text-indigo-600" />
                    Financeiro
                </h1>

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
                        {totalConsignmentsPending > 0 && <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs py-0.5 px-2 rounded-full">{totalConsignmentsPending}</span>}
                    </button>
                </div>

                <Button onClick={() => openModal()} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="mr-2 h-5 w-5" />
                    Registrar Despesa
                </Button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Contas a Receber (Installments) */}
                    {receivables.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-orange-900 flex items-center">
                                    <Clock className="mr-2 h-5 w-5 text-orange-600" />
                                    Contas a Receber (Parcelas)
                                </h2>
                                <span className="text-sm text-orange-700 bg-orange-100 px-2 py-1 rounded">
                                    Total: {formatCurrency(receivables.reduce((a, b) => a + b.amount, 0).toFixed(2))}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcela</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {receivables.map((inst) => (
                                            <tr key={inst.id} className={inst.isOverdue ? 'bg-red-50' : ''}>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {new Date(inst.data_vencimento).toLocaleDateString()}
                                                    {inst.isOverdue && <span className="ml-2 text-red-600 text-xs font-bold">(Atrasado)</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm">{inst.clientName}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">#{inst.parcelNumber}</td>
                                                <td className="px-6 py-4 text-sm text-right font-bold">{formatCurrency(inst.amount.toFixed(2))}</td>
                                                <td className="px-6 py-4 text-center flex justify-center gap-2">
                                                    <Button size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-50"
                                                        onClick={() => handlePayInstallment(inst)}>
                                                        <CheckSquare className="h-4 w-4 mr-1" /> Receber
                                                    </Button>

                                                    {inst.phone && (
                                                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => {
                                                            const phone = inst.phone?.replace(/\D/g, '');
                                                            if (phone) window.open(`https://wa.me/55${phone}?text=Olá ${inst.clientName}, lembrete do vencimento da parcela ${inst.parcelNumber} no valor de R$ ${inst.amount.toFixed(2)}`, '_blank');
                                                        }}>
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 text-center text-gray-500">
                            Nenhuma conta a receber pendente.
                        </div>
                    )}

                    {/* Stats & Transactions */}
                    <div className="mt-8 mb-8">
                        <h2 className="text-lg leading-6 font-medium text-zinc-900 mb-4 flex items-center">
                            <PieChart className="mr-2 h-5 w-5 text-zinc-500" /> Análise de Despesas
                        </h2>
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
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center">
                        <ShoppingBag className="h-6 w-6 text-indigo-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-bold text-indigo-900">Gestão de Consignados - Por Marca</h3>
                            <p className="text-sm text-indigo-700">Abaixo estão os itens vendidos que precisam ser pagos aos fornecedores.</p>
                        </div>
                    </div>

                    {Object.keys(consignmentGroups).length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                            Nenhum item consignado vendido pendente de pagamento.
                        </div>
                    ) : (
                        Object.entries(consignmentGroups).map(([brand, group]) => (
                            <div key={brand} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div
                                    className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleBrand(brand)}
                                >
                                    <div className="flex items-center">
                                        {expandedBrands[brand] ? <ChevronDown className="h-5 w-5 text-gray-500 mr-2" /> : <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />}
                                        <span className="text-lg font-bold text-gray-900 flex items-center">
                                            <Tag className="h-4 w-4 mr-2 text-indigo-500" />
                                            {brand}
                                        </span>
                                        <span className="ml-3 bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {group.items.length} itens
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-bold text-gray-900">
                                            A Pagar: {formatCurrency(group.totalCost.toFixed(2))}
                                        </span>
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePayBrandBatch(brand, group);
                                            }}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Pagar Marca
                                        </Button>
                                    </div>
                                </div>

                                {expandedBrands[brand] && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Venda</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Venda</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-indigo-600 uppercase">Custo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {group.items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nome_produto}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 text-right">{formatCurrency(Number(item.preco_unitario).toFixed(2))}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-indigo-700 text-right">{formatCurrency(Number(item.preco_custo).toFixed(2))}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={expenseForm.isConsignmentBatch ? "Confirmar Pagamento de Marca" : "Registrar Despesa"}
            >
                <form id="expenseForm" onSubmit={handleSaveExpense} className="space-y-4">
                    {expenseForm.isConsignmentBatch && (
                        <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 text-indigo-800 text-sm mb-4">
                            Isso registrará uma saída e marcará os itens desta marca como pagos.
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
                        {expenseForm.isConsignmentBatch ? "Confirmar Pagamento" : "Salvar"}
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
