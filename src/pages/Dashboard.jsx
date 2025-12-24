
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, PieChart as PieIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
    const [stats, setStats] = useState({
        todaySales: 0,
        monthProfit: 0,
        monthRevenue: 0,
        monthExpenses: 0
    });
    const [lowStockProducts, setLowStockProducts] = useState([]);

    // Chart Data States
    const [salesSevenDays, setSalesSevenDays] = useState([]);
    const [salesByMethod, setSalesByMethod] = useState([]);
    const [salesByCategory, setSalesByCategory] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Load Stats
                const summary = await db.financial.getSummary();
                setStats(summary);

                // Load Low Stock
                const products = await db.products.list();
                const lowStockFiltered = products.filter(p => {
                    const min = p.estoque_minimo || 5;
                    return p.qtd <= min;
                });
                setLowStockProducts(lowStockFiltered);

                // Load Analytics Data
                const sevenDays = await db.financial.getSalesLast7Days();
                setSalesSevenDays(sevenDays);

                const methods = await db.financial.getSalesByPaymentMethod();
                setSalesByMethod(methods);

                const categories = await db.financial.getSalesByCategory();
                setSalesByCategory(categories);

            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {subtext && (
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                    <div className="text-sm">
                        {subtext}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-10">
            {loading && <LoadingSpinner />}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Visão Geral</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                    title="Vendas Hoje"
                    value={`R$ ${stats.todaySales.toFixed(2)}`}
                    icon={TrendingUp}
                    color="bg-green-500"
                />
                <StatCard
                    title="Lucro Mensal"
                    value={`R$ ${stats.monthProfit.toFixed(2)}`}
                    icon={DollarSign}
                    color="bg-indigo-500"
                    subtext={<span className={stats.monthProfit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{stats.monthProfit >= 0 ? 'Lucro' : 'Prejuízo'}</span>}
                />
                <StatCard
                    title="Receita Mensal"
                    value={`R$ ${stats.monthRevenue.toFixed(2)}`}
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Despesas Mensais"
                    value={`R$ ${stats.monthExpenses.toFixed(2)}`}
                    icon={TrendingDown}
                    color="bg-red-500"
                />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Sales Last 7 Days */}
                <div className="bg-white p-6 rounded-lg shadow col-span-1 min-w-[300px]">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" /> Vendas - Últimos 7 Dias
                    </h3>
                    <div className="h-72 w-full" style={{ minHeight: '300px' }}>
                        {salesSevenDays.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesSevenDays}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Vendas']} cursor={{ fill: '#EEF2FF' }} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Sem dados recentes</div>
                        )}
                    </div>
                </div>

                {/* Sales By Payment Method (Pie) */}
                <div className="bg-white p-6 rounded-lg shadow col-span-1 min-w-[300px]">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <PieIcon className="h-5 w-5 mr-2 text-indigo-500" /> Métodos de Pagamento
                    </h3>
                    <div className="h-72 w-full" style={{ minHeight: '300px' }}>
                        {salesByMethod.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesByMethod}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {salesByMethod.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Sem dados</div>
                        )}
                    </div>
                </div>

                {/* Sales By Category (Bar - Horizontal or Vertical) */}
                <div className="bg-white p-6 rounded-lg shadow lg:col-span-2 min-w-[300px]">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <PieIcon className="h-5 w-5 mr-2 text-indigo-500" /> Vendas por Categoria (Quantidade)
                    </h3>
                    <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                        {salesByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesByCategory} >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#EEF2FF' }} />
                                    <Bar dataKey="value" fill="#8884d8" name="Qtd Vendida" radius={[4, 4, 0, 0]} barSize={50}>
                                        {salesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Sem dados</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center text-amber-600">
                    <AlertTriangle className="h-5 w-5 mr-2" /> Alerta de Estoque Baixo
                </h2>
                <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd Atual</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {lowStockProducts.length > 0 ? (
                                            lowStockProducts.map((product) => (
                                                <tr key={product.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.nome}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoria}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.tamanho}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{product.qtd}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 flex items-center">
                                                        <AlertTriangle className="h-4 w-4 mr-1" /> Baixo
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Nenhum produto com estoque baixo.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
