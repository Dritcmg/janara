
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Plus, Search, Edit, Trash, X, Upload, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { formatCurrency, parseCurrency } from '../lib/utils';

const Stock = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null); // For delete confirmation
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        categoria: '',
        tamanho: 'M',
        cor: '',
        custo: '',
        preco_venda: '',
        qtd: '',
        estoque_minimo: 5,
        imagem: '',
        is_consignado: false,
        marca: ''
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data, count } = await db.products.list({
                page,
                limit,
                search: searchTerm
            });
            setProducts(data);
            setTotalCount(count);
            setTotalPages(Math.ceil(count / limit));
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search or just load
        const timeoutId = setTimeout(() => {
            loadProducts();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

};

const openModal = (product = null) => {
    if (product) {
        setEditingProduct(product);
        setFormData({
            setPreviewUrl(URL.createObjectURL(file));
    }
};

const closeModal = () => {
    setIsModalOpen(false);
};

const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'custo' || name === 'preco_venda') {
        setFormData(prev => ({ ...prev, [name]: formatCurrency(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
        ...formData,
        custo: parseCurrency(formData.custo),
        preco_venda: parseCurrency(formData.preco_venda),
        qtd: parseInt(formData.qtd, 10) || 0,
        estoque_minimo: parseInt(formData.estoque_minimo, 10) || 0
    };

    try {
        setLoading(true);

        // Upload Image if selected
        if (selectedFile) {
            const publicUrl = await db.products.uploadImage(selectedFile);
            dataToSave.imagem = publicUrl;
        }

        // Always remove id and created_at to avoid issues with Supabase update/insert
        delete dataToSave.id;
        delete dataToSave.created_at;

        if (editingProduct) {
            await db.products.update(editingProduct.id, dataToSave);
            toast.success("Produto atualizado com sucesso!");
        } else {
            await db.products.add(dataToSave);
            toast.success("Produto criado com sucesso!");
        }
        await loadProducts();
        closeModal();
    } catch (error) {
        toast.error("Erro ao salvar produto: " + error.message);
    } finally {
        setLoading(false);
    }
};

const handleDeleteClick = (product) => {
    setProductToDelete(product);
};

const confirmDelete = async () => {
    if (!productToDelete) return;
    setLoading(true);
    try {
        await db.products.delete(productToDelete.id);
        toast.success("Produto excluído com sucesso!");
        await loadProducts();
        setProductToDelete(null);
    } catch (error) {
        toast.error("Erro ao excluir produto: " + error.message);
    } finally {
        setLoading(false);
    }
};

return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {loading && <LoadingSpinner />}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestão de Estoque</h1>
            <Button onClick={() => openModal()}>
                <Plus className="mr-2 h-5 w-5" />
                Novo Produto
            </Button>
        </div>

        <div className="mt-6">
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                    className="pl-10"
                    placeholder="Buscar por nome ou categoria..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
        </div>

        <div className="mt-6 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Img</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preços</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.imagem ? (
                                                <img src={product.imagem} alt={product.nome} className="h-10 w-10 object-cover rounded-full" />
                                            ) : (
                                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs shadow-inner">Foto</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                                            <div className="text-sm text-gray-500">{product.categoria}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Tam: {product.tamanho}</div>
                                            <div className="text-sm text-gray-500">Cor: {product.cor}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Venda: {Number(product.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                            <div className="text-sm text-gray-500">Custo: {Number(product.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.qtd}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="ghost" size="sm" onClick={() => openModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-2">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product)} className="text-red-600 hover:text-red-900">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* Pagination Controls */}
        <div className="py-3 flex items-center justify-between border-t border-gray-200">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Mostrando página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span> ({totalCount} resultados)
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Próxima
                        </button>
                    </nav>
                </div>
            </div>
        </div>

        {/* Product Modal */}
        {isModalOpen && (
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
            >
                <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input label="Nome do Produto" name="nome" value={formData.nome} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
                        <div className="flex items-center space-x-4">
                            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative group">
                                {(previewUrl || formData.imagem) ? (
                                    <img
                                        src={previewUrl || formData.imagem}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                )}
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white" onClick={() => document.getElementById('fileInput').click()}>
                                    <Edit className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('fileInput').click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Escolher Foto
                                </Button>
                                <p className="mt-1 text-xs text-gray-500">JPG, PNG ou WebP até 2MB.</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input label="Categoria" name="categoria" value={formData.categoria} onChange={handleChange} list="categories" placeholder="Ex: Consignado" />
                            <datalist id="categories">
                                <option value="Consignado" />
                                <option value="Roupas" />
                                <option value="Acessórios" />
                                <option value="Sapatos" />
                            </datalist>
                        </div>
                        <div>
                            <Input label="Cor" name="cor" value={formData.cor} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                            <select name="tamanho" value={formData.tamanho} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="P">P</option>
                                <option value="M">M</option>
                                <option value="G">G</option>
                                <option value="GG">GG</option>
                                <option value="UNICO">Único</option>
                            </select>
                        </div>
                        <div>
                            <Input type="number" label="Qtd" name="qtd" value={formData.qtd} onChange={handleChange} required />
                        </div>
                        <div>
                            <Input type="number" label="Estoque Mín." name="estoque_minimo" value={formData.estoque_minimo} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center mb-3">
                            <input
                                id="is_consignado"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={formData.is_consignado}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_consignado: e.target.checked }))}
                            />
                            <label htmlFor="is_consignado" className="ml-2 block text-sm font-medium text-gray-900">
                                Produto Consignado?
                            </label>
                        </div>

                        {formData.is_consignado && (
                            <div className="animate-fade-in">
                                <Input
                                    label="Marca / Fornecedor"
                                    name="marca"
                                    value={formData.marca}
                                    onChange={handleChange}
                                    placeholder="Ex: Marca XYZ"
                                    required={formData.is_consignado}
                                />
                                <p className="text-xs text-gray-500 mt-1">O valor de custo deste item será adicionado à lista de pagamentos desta marca.</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input label="Preço Custo (A Pagar)" name="custo" value={formData.custo} onChange={handleChange} required />
                        </div>
                        <div>
                            <Input label="Preço Venda" name="preco_venda" value={formData.preco_venda} onChange={handleChange} required />
                        </div>
                    </div>
                </form>
                <div className="mt-5 sm:flex sm:flex-row-reverse gap-2">
                    <Button type="submit" form="productForm">Salvar</Button>
                    <Button variant="secondary" onClick={closeModal} type="button">Cancelar</Button>
                </div>
            </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={!!productToDelete}
            onClose={() => setProductToDelete(null)}
            title="Excluir Produto"
        >
            <div className="py-4">
                <p className="text-sm text-gray-500">
                    Tem certeza que deseja excluir o produto <span className="font-bold text-gray-900">{productToDelete?.nome}</span>? Esta ação não pode ser desfeita.
                </p>
            </div>
            <div className="mt-5 sm:flex sm:flex-row-reverse gap-2">
                <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
                <Button variant="secondary" onClick={() => setProductToDelete(null)}>Cancelar</Button>
            </div>
        </Modal>
    </div>
);
};

export default Stock;
