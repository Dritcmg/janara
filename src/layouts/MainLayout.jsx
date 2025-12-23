
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ShoppingCart, DollarSign, Menu, X, Users, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Estoque', href: '/stock', icon: Box },
    { name: 'Vendas (PDV)', href: '/sales', icon: ShoppingCart },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Financeiro', href: '/financial', icon: DollarSign },
    { name: 'Relatórios', href: '/reports', icon: FileText },
];

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-zinc-900 shadow-xl transform transition-transform">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex-shrink-0 flex items-center px-4 text-white text-lg font-bold tracking-tight">
                                <span className="text-red-500">Jana</span> Roupas e Acessórios
                            </div>
                            <nav className="mt-8 px-2 space-y-2">
                                {navigation.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        className={({ isActive }) =>
                                            `group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${isActive
                                                ? 'bg-zinc-800 text-red-500 shadow-sm border-l-4 border-red-500'
                                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-red-400'
                                            }`
                                        }
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className={`mr-4 h-5 w-5 flex-shrink-0 transition-colors ${({ isActive }) => isActive ? 'text-red-500' : 'text-zinc-500 group-hover:text-red-400'}`} />
                                        {item.name}
                                    </NavLink>
                                ))}
                                <button
                                    onClick={handleLogout}
                                    className="w-full group flex items-center px-4 py-3 text-base font-medium rounded-xl text-zinc-400 hover:bg-red-900/20 hover:text-red-500 transition-all duration-200 mt-4"
                                >
                                    <LogOut className="mr-4 h-5 w-5 flex-shrink-0 group-hover:text-red-500" />
                                    Sair
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex-1 flex flex-col min-h-0 bg-zinc-900 shadow-xl border-r border-zinc-800">
                    <div className="flex items-center h-20 flex-shrink-0 px-6 bg-zinc-950">
                        <div className="flex flex-col">
                            <span className="text-white text-lg font-bold tracking-tight leading-tight"><span className="text-red-600">Jana</span> Roupas</span>
                            <span className="text-zinc-500 text-xs font-medium tracking-widest uppercase">e Acessórios</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <nav className="flex-1 px-4 py-6 space-y-2">
                            {navigation.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${isActive
                                            ? 'bg-zinc-800 text-red-500 shadow-md shadow-red-900/10 border-l-2 border-red-500'
                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-red-400'
                                        }`
                                    }
                                >
                                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${({ isActive }) => isActive ? 'text-red-500' : 'text-zinc-500 group-hover:text-red-400'}`} />
                                    {item.name}
                                </NavLink>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:bg-red-900/10 hover:text-red-500 transition-colors mt-auto"
                            >
                                <LogOut className="mr-3 h-5 w-5 flex-shrink-0 group-hover:text-red-500" />
                                Sair
                            </button>
                        </nav>
                    </div>
                    {/* Developer Credit in Sidebar Bottom */}
                    <div className="p-4 border-t border-zinc-800">
                        <p className="text-center text-xs text-zinc-600">
                            Developed by <span className="text-zinc-500 hover:text-red-500 transition-colors cursor-default">Dri_Dev</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:pl-64 flex flex-col flex-1">
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100 flex justify-between items-center pr-4">
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <span className="text-zinc-800 font-bold text-sm">Jana Roupas</span>
                </div>
                <main className="flex-1 relative">
                    <div className="py-6">
                        <Outlet />
                    </div>
                    <div className="md:hidden py-4 text-center border-t border-gray-200 mt-auto">
                        <p className="text-xs text-gray-400">Developed by Dri_Dev</p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
