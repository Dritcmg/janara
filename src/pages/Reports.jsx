
import React, { useState } from 'react';
import { db } from '../services/db';
import jsPDF from 'jspdf';
import { FileText, Download } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

const Reports = () => {
    const [reportType, setReportType] = useState('sales'); // 'sales' or 'financial'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        if (!startDate || !endDate) {
            toast.error('Por favor, selecione o período completo.');
            return;
        }

        setLoading(true);

        const doc = new jsPDF();
        const title = reportType === 'sales' ? 'Relatório de Vendas' : 'Relatório Financeiro';

        doc.setFontSize(18);
        doc.text(title, 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`, 105, 22, { align: 'center' });

        let y = 35;
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);

        if (reportType === 'sales') {
            try {
                const allSales = await db.sales.list();
                const sales = allSales.filter(s => {
                    const date = new Date(s.created_at).getTime();
                    return date >= start && date <= end;
                });

                if (sales.length === 0) {
                    toast("Nenhuma venda encontrada no período.", { icon: 'ℹ️' });
                    setLoading(false);
                    return;
                }

                const total = sales.reduce((sum, s) => sum + s.valor_total, 0);

                doc.setFontSize(12);
                doc.text(`Total de Vendas: ${sales.length}`, 14, y);
                y += 7;
                doc.text(`Faturamento Total: R$ ${total.toFixed(2)}`, 14, y);
                y += 10;

                doc.setFontSize(10);
                doc.text('Data', 14, y);
                doc.text('ID', 50, y);
                doc.text('Total', 150, y);
                doc.text('Pagamento', 170, y);
                y += 5;
                doc.line(14, y, 196, y);
                y += 5;

                sales.forEach(sale => {
                    if (y > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(new Date(sale.created_at).toLocaleString(), 14, y);
                    doc.text(sale.id.slice(0, 8), 50, y);
                    doc.text(`R$ ${sale.valor_total.toFixed(2)}`, 150, y);
                    doc.text(sale.metodo_pagamento || '-', 170, y);
                    y += 7;
                });

                doc.save(`relatorio_vendas_${startDate}_${endDate}.pdf`);
                toast.success("Relatório gerado com sucesso!");

            } catch (error) {
                console.error("Error fetching sales report:", error);
                toast.error("Erro ao buscar dados de vendas.");
            }

        } else if (reportType === 'financial') {
            try {
                const allFinancial = await db.financial.list();
                const financial = allFinancial.filter(f => {
                    const date = new Date(f.data).getTime();
                    return date >= start && date <= end;
                });

                if (financial.length === 0) {
                    toast("Nenhum registro financeiro encontrado no período.", { icon: 'ℹ️' });
                    setLoading(false);
                    return;
                }

                const income = financial.filter(f => f.tipo === 'entrada').reduce((sum, f) => sum + f.valor, 0);
                const expense = financial.filter(f => f.tipo === 'saida').reduce((sum, f) => sum + f.valor, 0);
                const balance = income - expense;

                doc.text(`Total Entradas: R$ ${income.toFixed(2)}`, 14, y);
                y += 7;
                doc.text(`Total Saídas: R$ ${expense.toFixed(2)}`, 14, y);
                y += 7;
                doc.setFont(undefined, 'bold');
                doc.setTextColor(balance >= 0 ? 0 : 200, balance >= 0 ? 100 : 0, 0);
                doc.text(`Saldo do Período: R$ ${balance.toFixed(2)}`, 14, y);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
                y += 10;

                doc.setFontSize(10);
                doc.text('Data', 14, y);
                doc.text('Descrição', 50, y);
                doc.text('Categoria', 110, y);
                doc.text('Valor', 170, y);
                y += 5;
                doc.line(14, y, 196, y);
                y += 5;

                financial.forEach(item => {
                    if (y > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    const isIncome = item.tipo === 'entrada';
                    doc.text(new Date(item.data).toLocaleString(), 14, y);
                    doc.text(item.descricao.slice(0, 30), 50, y);
                    doc.text(item.categoria || '-', 110, y);

                    doc.setTextColor(isIncome ? 0 : 200, isIncome ? 100 : 0, 0);
                    doc.text(`${isIncome ? '+' : '-'} R$ ${item.valor.toFixed(2)}`, 170, y);
                    doc.setTextColor(0, 0, 0);

                    y += 7;
                });

                doc.save(`relatorio_financeiro_${startDate}_${endDate}.pdf`);
                toast.success("Relatório gerado com sucesso!");

            } catch (error) {
                console.error("Error fetching financial report:", error);
                toast.error("Erro ao buscar dados financeiros.");
            }
        }
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {loading && <LoadingSpinner />}
            <h1 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center tracking-tight">
                <FileText className="mr-2 h-6 w-6 text-indigo-600" /> Relatórios
            </h1>

            <div className="bg-white shadow-sm sm:rounded-xl p-6 max-w-2xl border border-zinc-200">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo de Relatório</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-zinc-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                        >
                            <option value="sales">Vendas</option>
                            <option value="financial">Financeiro (Entradas e Saídas)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Data Início"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="Data Fim"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={generateReport}
                        className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="lg"
                    >
                        <Download className="mr-2 h-5 w-5" />
                        Gerar PDF
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Reports;
