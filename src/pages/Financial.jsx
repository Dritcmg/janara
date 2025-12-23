
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { ArrowUpCircle, ArrowDownCircle, Plus, PieChart, Wallet } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { formatCurrency, parseCurrency } from '../lib/utils'; // Assumed from previous steps

const Financial = () => {
    const [transactions, setTransactions] = useState([]);
    const [expenseStats, setExpenseStats] = useState({});
    const [filter, setFilter] = useState('all'); // all, entrada, saida
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
            const data = await db.financial.list(dateRange);
            setTransactions(data);
            const stats = await db.financial.getByCategory();
            setExpenseStats(stats);
        } catch (error) {
            console.error("Error loading financial data:", error);
            toast.error("Erro ao carregar dados financeiros");
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.tipo === filter);

    const openModal = () => {
        setExpenseForm({ descricao: '', categoria: 'Outros', valor: '' });
        setIsModalOpen(true);
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();

        if (!expenseForm.descricao || !expenseForm.valor) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        const valor = parseCurrency(expenseForm.valor);
        if (valor <= 0) {
            toast.error("Valor deve ser maior que zero");
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
            toast.success("Despesa registrada com sucesso!");
            setIsModalOpen(false);
            await loadData();
        } catch (error) {
            toast.error("Erro ao salvar despesa: " + error.message);
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {loading && <LoadingSpinner />}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center">
                    <Wallet className="mr-2 h-6 w-6 text-indigo-600" />
                    Financeiro
                </h1>
                <Button onClick={openModal} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="mr-2 h-5 w-5" />
                    Registrar Despesa
                </Button>
            </div>

            {/* Expense Analysis */}
            <div className="mt-8 mb-8">
                <h2 className="text-lg leading-6 font-medium text-zinc-900 mb-4 flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-zinc-500" /> Análise de Despesas (Este Mês)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(expenseStats).length > 0 ? (
                        Object.entries(expenseStats).map(([cat, val]) => (
                            <div key={cat} className="bg-white overflow-hidden shadow-sm rounded-xl p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow">
                                <dt className="text-xs font-medium text-zinc-500 truncate uppercase tracking-wider">{cat}</dt>
                                <dd className="mt-1 text-lg font-bold text-zinc-900">{formatCurrency(val.toString())}</dd>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-zinc-500 col-span-3 italic">Nenhuma despesa registrada este mês.</div>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg gap-4">
                <div className="flex space-x-2">
                    <Button variant={filter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('all')}>
                        Todas
                    </Button>
                    <Button variant={filter === 'entrada' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('entrada')} className={filter === 'entrada' ? 'bg-green-600 hover:bg-green-700 border-transparent' : 'text-green-600 border-green-200 hover:bg-green-50'}>
                        Entradas
                    </Button>
                    <Button variant={filter === 'saida' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('saida')} className={filter === 'saida' ? 'bg-red-600 hover:bg-red-700 border-transparent' : 'text-red-600 border-red-200 hover:bg-red-50'}>
                        Saídas
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Período:</span>
                    <Input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full sm:w-auto text-sm py-1.5"
                    />
                    <span className="text-sm text-gray-400 hidden sm:inline">até</span>
                    <Input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full sm:w-auto text-sm py-1.5"
                    />
                    {(dateRange.startDate || dateRange.endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDateRange({ startDate: '', endDate: '' })}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                        >
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-6 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow-sm overflow-hidden border-b border-zinc-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Descrição</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Categoria</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                    {filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                                {new Date(t.data).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                                                {t.descricao}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                                                    {t.categoria || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {t.tipo === 'entrada' ? (
                                                    <span className="flex items-center text-green-600 font-medium">
                                                        <ArrowUpCircle className="h-4 w-4 mr-1.5" /> Entrada
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600 font-medium">
                                                        <ArrowDownCircle className="h-4 w-4 mr-1.5" /> Saída
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.tipo === 'saida' ? '- ' : '+ '} {formatCurrency(t.valor.toFixed(2))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTransactions.length === 0 && (
                                <div className="p-8 text-center text-zinc-500 text-sm">
                                    Nenhuma transação encontrada.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Despesa"
            >
                <form id="expenseForm" onSubmit={handleSaveExpense} className="space-y-4">
                    <div>
                        <Input
                            label="Descrição"
                            name="descricao"
                            value={expenseForm.descricao}
                            onChange={handleFormChange}
                            placeholder="Ex: Aluguel, Conta de Luz..."
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
                                placeholder="R$ 0,00"
                                required
                            />
                        </div>
                    </div>
                </form>
                <div className="mt-5 sm:flex sm:flex-row-reverse gap-2">
                    <Button type="submit" form="expenseForm" className="bg-red-600 hover:bg-red-700 text-white">
                        Registrar Saída
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
