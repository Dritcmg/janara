
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Plus, Search, Edit, Trash, ShoppingBag, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [viewHistoryClient, setViewHistoryClient] = useState(null);
    const [clientHistory, setClientHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // History Modal State - using generic Modal but might need custom content
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);


    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: ''
    });

    const loadClients = async () => {
        try {
            const data = await db.clients.list();
            setClients(data);
        } catch (error) {
            console.error("Error loading clients:", error);
            toast.error("Erro ao carregar clientes");
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredClients = clients.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData(client);
        } else {
            setEditingClient(null);
            setFormData({
                nome: '',
                email: '',
                telefone: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await db.clients.update(editingClient.id, formData);
                toast.success("Cliente atualizado com sucesso!");
            } else {
                await db.clients.add(formData);
                toast.success("Cliente cadastrado com sucesso!");
            }
            loadClients();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Erro ao salvar cliente: " + error.message);
        }
    };

    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;
        try {
            await db.clients.delete(clientToDelete.id);
            toast.success("Cliente removido com sucesso!");
            loadClients();
            setDeleteModalOpen(false);
            setClientToDelete(null);
        } catch (error) {
            toast.error("Erro ao excluir cliente: " + error.message);
        }
    };

    const openHistory = async (client) => {
        setViewHistoryClient(client);
        setIsHistoryModalOpen(true);
        try {
            const history = await db.clients.getHistory(client.id);
            setClientHistory(history);
        } catch (error) {
            console.error("Error loading history:", error);
            toast.error("Erro ao carregar histórico");
        }
    };

    const closeHistory = () => {
        setIsHistoryModalOpen(false);
        setViewHistoryClient(null);
        setClientHistory([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {loading && <LoadingSpinner />}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center">
                    <User className="mr-2 h-6 w-6 text-indigo-600" />
                    Gerenciar Clientes
                </h1>
                <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-5 w-5" />
                    Novo Cliente
                </Button>
            </div>

            <div className="mt-6">
                <Input
                    icon={Search}
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="max-w-md"
                />
            </div>

            <div className="mt-6 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow-sm overflow-hidden border-b border-zinc-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Telefone</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                    {filteredClients.length > 0 ? filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{client.nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{client.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{client.telefone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openHistory(client)} className="text-blue-600 hover:text-blue-900 mr-4 transition-colors p-1 rounded hover:bg-blue-50" title="Histórico de Compras">
                                                    <ShoppingBag className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => openModal(client)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors p-1 rounded hover:bg-indigo-50" title="Editar">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(client)} className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50" title="Excluir">
                                                    <Trash className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-sm text-zinc-500 italic">Nenhum cliente encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            >
                <form id="clientForm" onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome Completo"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        placeholder="Nome do cliente"
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplo.com"
                    />
                    <Input
                        label="Telefone"
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                    />
                </form>
                <div className="mt-5 sm:flex sm:flex-row-reverse gap-2">
                    <Button type="submit" form="clientForm">
                        Salvar
                    </Button>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                        Cancelar
                    </Button>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={closeHistory}
                title={`Histórico de Compras - ${viewHistoryClient?.nome || ''}`}
                maxWidth="2xl"
            >
                <div className="mt-2 max-h-96 overflow-y-auto pr-2">
                    {clientHistory.length > 0 ? (
                        <ul className="divide-y divide-zinc-200">
                            {clientHistory.map(sale => (
                                <li key={sale.id} className="py-4">
                                    <div className="flex justify-between space-x-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-zinc-900 border-b border-zinc-100 pb-1 mb-2">
                                                Compra em {new Date(sale.created_at).toLocaleString()}
                                            </p>
                                            <div className="pl-2 border-l-2 border-zinc-200">
                                                <p className="text-xs text-zinc-500">ID Venda: {sale.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-zinc-900">R$ {sale.valor_total.toFixed(2)}</span>
                                            <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded mt-1 uppercase tracking-wide font-semibold">{sale.metodo_pagamento}</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <ShoppingBag className="mx-auto h-12 w-12 text-zinc-300" />
                            <p className="mt-2 text-sm text-zinc-500">Este cliente ainda não realizou compras.</p>
                        </div>
                    )}
                </div>
                <div className="mt-5 sm:flex sm:flex-row-reverse">
                    <Button variant="secondary" onClick={closeHistory} type="button">
                        Fechar
                    </Button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Excluir Cliente"
            >
                <div>
                    <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir o cliente <b>{clientToDelete?.nome}</b>? Esta ação não pode ser desfeita.
                    </p>
                    <div className="mt-5 sm:flex sm:flex-row-reverse gap-2">
                        <Button
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                        >
                            Excluir
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Clients;
