
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ShoppingCart, DollarSign, Menu, X, Users, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'PDV', href: '/sales', icon: ShoppingCart }, // Shortened for mobile
    { name: 'Estoque', href: '/stock', icon: Box },
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
            {/* Bottom Navigation for Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 pb-safe">
                <div className="flex justify-between items-center h-16">
                    {navigation.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-red-600' : 'text-zinc-500'}`
                            }
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium truncate max-w-[60px]">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

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
                <div className="sticky top-0 z-10 md:hidden pl-4 pt-3 pb-3 bg-white shadow-sm flex justify-between items-center pr-4">
                    <span className="text-red-600 font-bold text-lg">Jana <span className="text-zinc-800">Roupas</span></span>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
                <main className="flex-1 relative">
                    <div className="py-6 mb-16 md:mb-0">
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
