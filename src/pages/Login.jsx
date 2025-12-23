import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Loader } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            setError('Credenciais inválidas. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Visual & Brand with Light Guava background */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#FFF0F0] overflow-hidden items-center justify-center">
                {/* Soft Guava/Red Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffe4e6] via-[#fff1f2] to-white opacity-80"></div>

                {/* Decorative Elements for "Chic" feel */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-red-500/5 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-red-400/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center mb-8 p-4 transform hover:scale-105 transition-transform duration-500">
                        <img
                            src="/logo.jpg"
                            alt="Jana Store Logo"
                            className="w-full h-full object-cover rounded-full"
                        />
                    </div>

                    <div className="space-y-4 max-w-md">
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                            Jana Store
                        </h1>
                        <p className="text-lg text-gray-500 font-light leading-relaxed">
                            Elegância e eficiência na gestão do seu negócio.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
                {/* Mobile Header (only visible on small screens) */}
                <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-full shadow-md" />
                    <span className="text-xl font-bold text-gray-900">Jana Store</span>
                </div>

                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Bem-vindo
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Acesse sua conta para continuar.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    // Focus ring is now Red
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Senha
                                </label>
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-red-600 hover:text-red-500 transition-colors">
                                        Esqueceu a senha?
                                    </a>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 border border-red-100 animate-fade-in">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Erro no login</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                // Button is now Red
                                className="group w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader className="animate-spin h-5 w-5 text-white" />
                                ) : (
                                    <span className="flex items-center">
                                        Entrar
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Não tem acesso?
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center text-sm">
                            <a href="#" className="font-medium text-red-600 hover:text-red-500">
                                Contate o suporte
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
