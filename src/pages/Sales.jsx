import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';
import { Search, ShoppingCart, Trash, Plus, Minus, Printer, Check, User, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import LoadingSpinner from '../components/LoadingSpinner';

const Sales = () => {
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('janara_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Checkout States
    const [paymentMethod, setPaymentMethod] = useState('dinheiro');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [amountPaid, setAmountPaid] = useState(''); // New: Amount user actually pays now
    const [dueDate, setDueDate] = useState(''); // New: Due date for remaining balance

    // UI States
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('value');
    const [loading, setLoading] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 12;

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
        localStorage.setItem('janara_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadProducts();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const addToCart = (product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.produto_id === product.id);
            if (existingItem) {
                if (existingItem.quantidade >= product.qtd) {
                    toast.error("Estoque insuficiente!");
                    return currentCart;
                }
                return currentCart.map(item =>
                    item.produto_id === product.id
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }
            return [...currentCart, {
                produto_id: product.id,
                nome: product.nome,
                preco_unitario: product.preco_venda,
                quantidade: 1,
                estoque_max: product.qtd
            }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.produto_id !== productId));
    };

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

    const subtotal = cart.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);

    const discountValue = discountType === 'percent'
        ? (subtotal * (discount / 100))
        : parseFloat(discount) || 0;

    const finalTotal = Math.max(0, subtotal - discountValue);

    // Calculate remaining and status
    const paidValue = amountPaid === '' ? finalTotal : parseFloat(amountPaid);
    const remainingValue = Math.max(0, finalTotal - paidValue);
    const paymentStatus = remainingValue > 0 ? (remainingValue === finalTotal ? 'pendente' : 'parcial') : 'pago';

    // Auto-fill amountPaid when cart changes if it was "full" before
    // But better to just let it be empty (implying full payment) or controlled.
    // We'll treat empty string as "Full Payment" for logic, but for UI keep it explicit.

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Validation for partial payment
        if (remainingValue > 0 && !selectedClientId) {
            toast.error("Para pagamentos parciais ou pendentes, é obrigatório selecionar um cliente.");
            return;
        }
        if (remainingValue > 0 && !dueDate) {
            toast.error("Por favor, defina uma data de vencimento para o saldo restante.");
            return;
        }

        const saleData = {
            valor_total: finalTotal,
            subtotal: subtotal,
            desconto: discountValue,
            metodo_pagamento: paymentMethod,
            cliente_id: selectedClientId || null,
            // New Fields
            valor_pago: paidValue,
            status_pagamento: paymentStatus,
            data_vencimento: remainingValue > 0 ? dueDate : null
        };

        setLoading(true);
        try {
            const sale = await db.sales.create(saleData, cart);
            const clientName = clients.find(c => c.id === selectedClientId)?.nome || 'Consumidor Final';
            setLastSale({ ...sale, items: cart, clientName, remainingValue, paidValue });
            setShowReceiptModal(true);
            setCart([]);
            setSelectedClientId('');
            setAmountPaid('');
            setDueDate('');
            setDiscount(0);
            toast.success("Venda realizada com sucesso!");

            await loadProducts();
        } catch (error) {
            console.error(error);
            let msg = 'Erro ao finalizar venda.';
            if (error.message && error.message.includes('Estoque')) {
                msg = 'Estoque insuficiente para um ou mais produtos.';
            } else if (error.message) {
                msg = `Erro: ${error.message}`;
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        if (!lastSale) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });

        doc.setFontSize(10);
        doc.text('ModaControl - Recibo', 40, 10, { align: 'center' });
        doc.text(`Venda #${lastSale.id.slice(0, 8)}`, 40, 15, { align: 'center' });
        doc.text(`Data: ${new Date(lastSale.created_at).toLocaleString()}`, 40, 20, { align: 'center' });
        doc.text(`Cliente: ${lastSale.clientName || 'Consumidor Final'}`, 40, 25, { align: 'center' });

        doc.line(5, 30, 75, 30);

        let y = 35;
        lastSale.items.forEach(item => {
            doc.text(`${item.nome}`, 5, y);
            doc.text(`${item.quantidade}x R$${item.preco_unitario.toFixed(2)}`, 75, y, { align: 'right' });
            y += 5;
        });

        doc.line(5, y, 75, y);
        y += 5;

        doc.text(`Subtotal: R$ ${lastSale.subtotal?.toFixed(2) || lastSale.valor_total.toFixed(2)}`, 75, y, { align: 'right' });
        y += 5;
        if (lastSale.desconto > 0) {
            doc.text(`Desconto: -R$ ${lastSale.desconto.toFixed(2)}`, 75, y, { align: 'right' });
            y += 5;
        }

        doc.setFontSize(12);
        doc.text(`TOTAL: R$ ${lastSale.valor_total.toFixed(2)}`, 40, y, { align: 'center' });
        y += 5;
        doc.setFontSize(10);

        // Payment Details
        doc.text(`Pago: R$ ${lastSale.paidValue?.toFixed(2)} (${lastSale.metodo_pagamento})`, 40, y, { align: 'center' });
        y += 5;

        if (lastSale.remainingValue > 0) {
            doc.text(`Restante: R$ ${lastSale.remainingValue.toFixed(2)}`, 40, y, { align: 'center' });
            y += 5;
            doc.text(`Vencimento: ${new Date(lastSale.data_vencimento).toLocaleDateString()}`, 40, y, { align: 'center' });
        }

        const pdfUrl = doc.output('bloburl');
        window.open(pdfUrl, '_blank');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4">
            {loading && <LoadingSpinner />}
            {/* Left: Product List */}
            <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative max-w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            className="pl-10"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 content-start pb-20 md:pb-4">
                    {products.map(product => (
                        <div
                            key={product.id}
                            className="border rounded-lg p-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between bg-white group"
                            onClick={() => addToCart(product)}
                        >
                            <div className="flex flex-col items-center mb-2">
                                {product.imagem ? (
                                    <img src={product.imagem} alt={product.nome} className="h-24 w-24 object-cover rounded-md mb-2 group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="h-24 w-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs mb-2">Sem Foto</div>
                                )}
                                <div className="w-full text-center">
                                    <h3 className="font-medium text-gray-900 truncate" title={product.nome}>{product.nome}</h3>
                                    <p className="text-xs text-gray-500 truncate">{product.categoria} - {product.tamanho}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-md font-bold text-indigo-600">{Number(product.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Qtd: {product.qtd}</span>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && !loading && (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            Nenhum produto encontrado.
                        </div>
                    )}
                </div>
                {/* Pagination */}
                <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600">Pág. {page} de {totalPages}</span>
                        <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:inline-block">{totalCount} produtos</span>
                </div>
            </div>

            {/* Mobile Cart Floating Button */}
            <button
                className="md:hidden fixed bottom-20 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-40 flex items-center justify-center transform hover:scale-105 transition-all"
                onClick={() => setIsCartOpen(true)}
            >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cart.reduce((acc, item) => acc + item.quantidade, 0)}
                    </span>
                )}
            </button>

            {/* Right: Cart (Responsive) */}
            <div className={`fixed inset-0 z-50 bg-white md:relative md:inset-auto md:z-auto md:w-96 md:bg-white md:rounded-lg md:shadow md:flex md:flex-col ${isCartOpen ? 'flex flex-col' : 'hidden md:flex'}`}>
                <div className="p-4 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Carrinho
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="md:hidden text-gray-500">Fechar</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">Carrinho vazio</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.produto_id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium">{item.nome}</h4>
                                    <div className="text-xs text-gray-500">
                                        {Number(item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} x {item.quantidade}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.produto_id, -1)} className="h-10 w-10 p-0 flex items-center justify-center rounded-full border border-gray-200"><Minus className="h-5 w-5" /></Button>
                                    <span className="w-6 text-center text-base font-medium">{item.quantidade}</span>
                                    <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.produto_id, 1)} className="h-10 w-10 p-0 flex items-center justify-center rounded-full border border-gray-200"><Plus className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.produto_id)} className="h-10 w-10 p-0 flex items-center justify-center text-red-500 hover:text-red-600 rounded-full hover:bg-red-50 ml-2"><Trash className="h-5 w-5" /></Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg space-y-4">
                    {/* Client Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <User className="h-4 w-4 mr-1" /> Cliente {remainingValue > 0 && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className={`block w-full border rounded-md shadow-sm sm:text-sm p-2 ${remainingValue > 0 && !selectedClientId ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        >
                            <option value="">Consumidor Final</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Totals & Discount */}
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Desconto</label>
                            <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="sm:text-xs py-1.5" />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs p-1.5">
                                <option value="value">R$</option>
                                <option value="percent">%</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                        <span>Total:</span>
                        <span>{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>

                    {/* Partial Payment Section */}
                    <div className="space-y-3 pt-2 border-t border-dashed border-gray-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">R$</span>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={finalTotal.toFixed(2)}
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {remainingValue > 0 && (
                            <div className="bg-orange-50 p-3 rounded-md border border-orange-100 animate-fade-in">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-orange-800 font-medium">Restante:</span>
                                    <span className="text-orange-900 font-bold">{remainingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <label className="block text-xs font-medium text-orange-800 mb-1 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" /> Data de Vencimento
                                </label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="text-sm border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento (Entrada)</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                        >
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                            <option value="pix">PIX</option>
                        </select>
                    </div>

                    <Button onClick={handleCheckout} disabled={cart.length === 0} className="w-full" size="lg">
                        Finalizar Venda
                    </Button>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setShowReceiptModal(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                            <div>
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                    <Check className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Venda Realizada!</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">A venda foi registrada com sucesso.</p>
                                        {lastSale?.remainingValue > 0 && (
                                            <p className="text-sm text-orange-600 mt-2 font-medium">
                                                Saldo devedor: R$ {lastSale.remainingValue.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 space-y-2">
                                <button onClick={generatePDF} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                    <Printer className="mr-2 h-5 w-5" /> Imprimir Recibo
                                </button>
                                <button onClick={() => setShowReceiptModal(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                    Fechar
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
