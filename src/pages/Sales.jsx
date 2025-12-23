import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';
import { Search, ShoppingCart, Trash, Plus, Minus, Printer, Check, User, ChevronLeft, ChevronRight, Calculator, Calendar, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import LoadingSpinner from '../components/LoadingSpinner';

const Sales = () => {
    // Core Data
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Cart
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('janara_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Flow State
    const [currentStep, setCurrentStep] = useState(1); // 1: Cart/Search, 2: Checkout/Payment

    // Checkout States
    const [selectedClientId, setSelectedClientId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('dinheiro'); // dinheiro, cartao, pix, crediario

    // Installment Logic
    const [entryValue, setEntryValue] = useState(''); // Entrada
    const [installmentCount, setInstallmentCount] = useState(1);
    const [installments, setInstallments] = useState([]); // Array of { number, value, dueDate, status }

    // Discount
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('value');

    // UI States
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 12;

    // --- Loading Data ---
    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data, count } = await db.products.list({ page, limit, search: searchTerm });
            setProducts(data);
            setTotalCount(count);
            setTotalPages(Math.ceil(count / limit));
        } catch (error) {
            console.error("Error loading products:", error);
            toast.error("Erro ao carregar produtos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        db.clients.list().then(data => setClients(Array.isArray(data) ? data : [])).catch(console.error);
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadProducts();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm]);

    useEffect(() => {
        localStorage.setItem('janara_cart', JSON.stringify(cart));
    }, [cart]);

    // --- Calculations ---
    const subtotal = cart.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
    const discountValue = discountType === 'percent' ? (subtotal * (discount / 100)) : parseFloat(discount) || 0;
    const finalTotal = Math.max(0, subtotal - discountValue);

    // --- Installment Generator ---
    useEffect(() => {
        // Regenerate installments plan when total, entry, or count changes
        if (currentStep === 2) {
            generateInstallments();
        }
    }, [finalTotal, entryValue, installmentCount, paymentMethod]);

    const generateInstallments = () => {
        const entry = parseFloat(entryValue) || 0;
        const remaining = Math.max(0, finalTotal - entry);

        // If paid in full immediately (Cash/Pix/Debit w/o installments)
        // Just 1 "installment" that is already PAID? Or empty array?
        // Let's create an array to visualize it for the user if they want to split card payments too? 
        // For simplicity:
        // - "dinheiro", "pix", "cartao_debito": Usually 1 lump sum.
        // - "cartao_credito", "crediario": Can be parcelado.

        if (remaining <= 0) {
            setInstallments([]);
            return;
        }

        if (installmentCount < 1) return;

        const valPerInst = remaining / installmentCount;
        const newInstallments = [];

        for (let i = 1; i <= installmentCount; i++) {
            const date = new Date();
            date.setDate(date.getDate() + (i * 30)); // Simple 30 days logic

            newInstallments.push({
                numero: i,
                valor: valPerInst,
                vencimento: date.toISOString().split('T')[0],
                status: 'pendente'
            });
        }
        setInstallments(newInstallments);
    };

    const handleInstallmentChange = (index, field, value) => {
        const newInst = [...installments];
        newInst[index] = { ...newInst[index], [field]: value };
        setInstallments(newInst);
    };

    // --- Cart Actions ---
    const addToCart = (product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.produto_id === product.id);
            if (existingItem) {
                if (existingItem.quantidade >= product.qtd) {
                    toast.error("Estoque insuficiente!");
                    return currentCart;
                }
                return currentCart.map(item => item.produto_id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item);
            }
            return [...currentCart, {
                produto_id: product.id,
                nome: product.nome,
                preco_unitario: product.preco_venda,
                quantidade: 1,
                estoque_max: product.qtd
            }];
        });
        toast.success("Produto adicionado!");
    };

    const removeFromCart = (productId) => setCart(cart.filter(item => item.produto_id !== productId));

    const updateQuantity = (productId, delta) => {
        setCart(currentCart => {
            return currentCart.map(item => {
                if (item.produto_id === productId) {
                    const newQty = item.quantidade + delta;
                    if (newQty <= 0) return item;
                    if (item.estoque_max && newQty > item.estoque_max) {
                        toast.error("Limite de estoque atingido");
                        return item;
                    }
                    return { ...item, quantidade: newQty };
                }
                return item;
            });
        });
    };

    // --- Checkout Actions ---
    const handleCheckout = async () => {
        const entry = parseFloat(entryValue) || 0;

        // Validation
        if (finalTotal > entry && !selectedClientId) {
            toast.error("Para vendas não quitadas integralmente, selecione um Cliente.");
            return;
        }

        // Construct Parcelas Array for DB
        // If fully paid, we send 1 'paid' installment or handle as just cash legacy? 
        // The new RPC supports 'p_parcelas'.
        let parcelasPayload = [];

        if (finalTotal > entry) {
            // Has remaining balance -> Use generated installments
            parcelasPayload = installments.map(inst => ({
                numero_parcela: inst.numero,
                valor_parcela: inst.valor,
                data_vencimento: inst.vencimento,
                status: 'pendente'
            }));
        } else {
            // Fully Paid immediately. 
            // Technically 0 installments pending. 
            // We pass empty array for parcelas, and handle 'valor_pago' in main object.
            parcelasPayload = [];
        }

        const saleData = {
            valor_total: finalTotal,
            subtotal: subtotal,
            desconto: discountValue,
            metodo_pagamento: paymentMethod,
            cliente_id: selectedClientId || null,
            valor_pago: entry >= finalTotal ? finalTotal : entry // Amount actually received NOW
        };

        setLoading(true);
        try {
            // Call the NEW RPC signature: create(saleData, cartItems, parcelas)
            // Need to update db.js service or call supabase RPC directly here?
            // Assuming db.sales.create handles it or we update it. 
            // Let's CALL RPC DIRECTLY here to be safe with the new signature
            const { data, error } = await db.sales.createWithInstallments(saleData, cart, parcelasPayload);

            if (error) throw error;

            const clientName = clients.find(c => c.id === selectedClientId)?.nome || 'Consumidor Final';
            setLastSale({ ...saleData, id: data.id, created_at: data.created_at, items: cart, clientName, parcelas: parcelasPayload });

            setShowReceiptModal(true);

            // Reset
            setCart([]);
            setCurrentStep(1);
            setSelectedClientId('');
            setEntryValue('');
            setInstallmentCount(1);
            setDiscount(0);

            toast.success("Venda Finalizada!");
            loadProducts();

        } catch (error) {
            console.error(error);
            toast.error("Erro ao finalizar venda: " + (error.message || "Erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        if (!lastSale) return;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });

        doc.setFontSize(10);
        doc.text('Janara - Recibo', 40, 10, { align: 'center' });
        doc.text(`Venda #${lastSale.id.slice(0, 8)}`, 40, 15, { align: 'center' });
        doc.text(`Data: ${new Date(lastSale.created_at).toLocaleString()}`, 40, 20, { align: 'center' });
        doc.text(`Cliente: ${lastSale.clientName}`, 40, 25, { align: 'center' });

        // Line
        doc.line(5, 30, 75, 30);

        let y = 35;
        lastSale.items.forEach(item => {
            const itemName = item.nome.length > 25 ? item.nome.substring(0, 22) + '...' : item.nome;
            doc.text(`${itemName}`, 5, y);
            doc.text(`${item.quantidade}x R$${Number(item.preco_unitario).toFixed(2)}`, 75, y, { align: 'right' });
            y += 5;
        });

        doc.line(5, y, 75, y); y += 5;
        doc.text(`SubTotal: R$ ${Number(lastSale.subtotal).toFixed(2)}`, 75, y, { align: 'right' }); y += 5;
        if (lastSale.desconto > 0) {
            doc.text(`Desconto: -R$ ${Number(lastSale.desconto).toFixed(2)}`, 75, y, { align: 'right' }); y += 5;
        }

        doc.setFontSize(12);
        doc.text(`TOTAL: R$ ${Number(lastSale.valor_total).toFixed(2)}`, 40, y, { align: 'center' }); y += 7;

        doc.setFontSize(10);
        doc.text(`Pago Agora: R$ ${Number(lastSale.valor_pago || 0).toFixed(2)}`, 75, y, { align: 'right' }); y += 5;

        if (lastSale.parcelas && lastSale.parcelas.length > 0) {
            y += 5;
            doc.line(5, y, 75, y); y += 5;
            doc.text(`Parcelas Futuras:`, 5, y); y += 5;
            lastSale.parcelas.forEach(p => {
                doc.text(`${p.numero_parcela}x ${new Date(p.data_vencimento).toLocaleDateString()}`, 5, y);
                doc.text(`R$ ${Number(p.valor_parcela).toFixed(2)}`, 75, y, { align: 'right' });
                y += 5;
            });
        }

        const pdfUrl = doc.output('bloburl');
        window.open(pdfUrl, '_blank');
    };

    // --- Steps Render ---

    // STEP 1: PRODUCTS
    const renderStep1 = () => (
        <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Wrapper for Products Grid */}
            <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b flex justify-between items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            className="pl-10"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    {/* Cart Summary Button for Mobile */}
                    <Button className="md:hidden relative" onClick={() => setCurrentStep(2)} disabled={cart.length === 0}>
                        <ShoppingCart className="h-5 w-5" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{cart.reduce((a, b) => a + b.quantidade, 0)}</span>
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                    {products.map(product => (
                        <div key={product.id} onClick={() => addToCart(product)}
                            className="border rounded-lg p-2 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex flex-col bg-white group h-48 justify-between">
                            <div className="flex flex-col items-center flex-1">
                                {product.imagem ? (
                                    <img src={product.imagem} alt={product.nome} className="h-20 w-20 object-cover rounded mb-2" />
                                ) : (
                                    <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 mb-2">Sem Foto</div>
                                )}
                                <h3 className="font-medium text-sm text-gray-900 line-clamp-2 text-center w-full">{product.nome}</h3>
                            </div>
                            <div className="mt-2 flex justify-between items-center w-full">
                                <span className="font-bold text-indigo-600 text-sm">R$ {Number(product.preco_venda).toFixed(2)}</span>
                                <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">Etq: {product.qtd}</span>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && !loading && <div className="col-span-full text-center text-gray-500 mt-10">Nenhum produto encontrado.</div>}
                </div>
                {/* Pagination - Compact */}
                <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-gray-600">Página {page} / {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* Cart Preview (Sidebar) */}
            <div className="w-full md:w-80 bg-white rounded-lg shadow flex flex-col h-full hidden md:flex">
                <div className="p-4 border-b bg-gray-50 font-medium flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-indigo-600" /> Carrinho Atual
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.produto_id} className="flex justify-between items-start border-b pb-2 last:border-0">
                            <div className="flex-1 pr-2">
                                <div className="text-sm font-medium line-clamp-1">{item.nome}</div>
                                <div className="text-xs text-gray-500">{item.quantidade}x {formatCurrency(item.preco_unitario)}</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => updateQuantity(item.produto_id, -1)} className="p-1 hover:bg-gray-100 rounded"><Minus className="h-4 w-4 text-gray-600" /></button>
                                <button onClick={() => updateQuantity(item.produto_id, 1)} className="p-1 hover:bg-gray-100 rounded"><Plus className="h-4 w-4 text-gray-600" /></button>
                                <button onClick={() => removeFromCart(item.produto_id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash className="h-4 w-4" /></button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">Carrinho vazio</div>}
                </div>
                <div className="p-4 bg-gray-50 border-t">
                    <div className="flex justify-between text-lg font-bold mb-4">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setCurrentStep(2)}>
                        Ir para Pagamento
                    </Button>
                </div>
            </div>
        </div>
    );

    // STEP 2: PAYMENT
    const renderStep2 = () => (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-w-6xl mx-auto overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
            {/* Left: Summary & Client */}
            <div className="flex-1 space-y-6 lg:overflow-y-auto lg:pr-2">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="p-0 mr-2"><ArrowLeft className="h-5 w-5" /></Button>
                        <h2 className="text-lg font-medium">Resumo do Pedido</h2>
                    </div>
                    <div className="space-y-2 mb-4 border-b pb-4">
                        {cart.map(item => (
                            <div key={item.produto_id} className="flex justify-between text-sm">
                                <span>{item.quantidade}x {item.nome}</span>
                                <span>{formatCurrency(item.quantidade * item.preco_unitario)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Desconto</span>
                                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="text-xs border rounded p-1">
                                    <option value="value">R$</option>
                                    <option value="percent">%</option>
                                </select>
                            </div>
                            <Input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="w-24 text-right h-8"
                                min="0"
                            />
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                            <span>TOTAL A PAGAR</span>
                            <span className="text-indigo-600">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Cliente</h3>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm p-2"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="">Consumidor Final</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    {!selectedClientId && finalTotal > (parseFloat(entryValue) || 0) && (
                        <p className="text-xs text-red-500 mt-1">* Obrigatório para parcelamento</p>
                    )}
                </div>
            </div>

            {/* Right: Payment Logic */}
            <div className="flex-1 bg-white p-6 rounded-lg shadow flex flex-col h-fit">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Calculator className="h-5 w-5" /> Pagamento</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'crediario'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`p-2 rounded border text-sm capitalize ${paymentMethod === method ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {method.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Entrada / Valor Pago</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -transaction-y-1/2 text-gray-500">R$</span>
                                <Input
                                    className="pl-8"
                                    type="number"
                                    value={entryValue}
                                    onChange={(e) => setEntryValue(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nº Parcelas (Restante)</label>
                            <Input
                                type="number"
                                min="1"
                                max="24"
                                value={installmentCount}
                                onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 1)}
                                disabled={(parseFloat(entryValue) || 0) >= finalTotal}
                            />
                        </div>
                    </div>

                    {/* Parcelas Preview */}
                    {installments.length > 0 && (
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                            <h4 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Plano de Pagamento</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {installments.map((inst, idx) => (
                                    <div key={idx} className="flex gap-2 items-center text-sm">
                                        <span className="w-6 text-indigo-700 font-medium">{inst.numero}x</span>
                                        <Input
                                            type="date"
                                            value={inst.vencimento}
                                            onChange={(e) => handleInstallmentChange(idx, 'vencimento', e.target.value)}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <div className="relative w-24">
                                            <span className="absolute left-1 top-1.5 text-xs text-gray-400">R$</span>
                                            <Input
                                                type="number"
                                                value={inst.valor}
                                                onChange={(e) => handleInstallmentChange(idx, 'valor', parseFloat(e.target.value) || 0)}
                                                className="h-8 text-xs pl-5 text-right"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t mt-4">
                        <Button className="w-full text-lg h-12" onClick={handleCheckout} disabled={loading}>
                            {loading ? <LoadingSpinner size="sm" /> : `Finalizar Venda (${formatCurrency(finalTotal)})`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-5rem)] p-2 md:p-4 max-w-7xl mx-auto">
            {loading && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><LoadingSpinner /></div>}

            {currentStep === 1 ? renderStep1() : renderStep2()}

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setShowReceiptModal(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-middle bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full sm:p-6">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4 stroke-green-600">
                                    <Check className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Venda Concluída!</h3>
                            </div>
                            <div className="mt-5 sm:mt-6 space-y-2">
                                <button onClick={generatePDF} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700">
                                    <Printer className="mr-2 h-5 w-5" /> Imprimir Recibo
                                </button>
                                <button onClick={() => setShowReceiptModal(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500">
                                    Fechar/Nova Venda
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
