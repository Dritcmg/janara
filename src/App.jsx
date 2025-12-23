import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import Financial from './pages/Financial';
import Clients from './pages/Clients';
import Login from './pages/Login';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Toaster position="top-right" />
          {/* Navbar component is not defined in the original code, so it's commented out or needs to be added */}
          {/* <Navbar /> */}
          <div className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Routes wrapped in MainLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
