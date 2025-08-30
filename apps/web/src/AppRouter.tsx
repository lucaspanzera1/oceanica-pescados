import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Routes>
          {/* Rota pública - página inicial (sempre acessível) */}
          <Route
            path="/"
            element={
              <PublicRoute restrictWhenAuthenticated={false}>
                <Home />
              </PublicRoute>
            }
          />
          {/* Outras rotas públicas */}
          <Route
            path="/produtos"
            element={
              <PublicRoute>
                <Products />
              </PublicRoute>
            }
          />
                    <Route
            path="/produtos/:id"
            element={
              <PublicRoute>
                <ProductDetail />
              </PublicRoute>
            }
          />
                              <Route
            path="/cart"
            element={
              <PublicRoute>
                <Cart />
              </PublicRoute>
            }
          />

          {/* Rota pública - login (restrita para usuários logados) */}
          <Route
            path="/login"
            element={
              <PublicRoute restrictWhenAuthenticated={true} redirectTo="/">
                <Login />
              </PublicRoute>
            }
          />
          {/* Rota pública - register (restrita para usuários logados) */}
          <Route
            path="/register"
            element={
              <PublicRoute restrictWhenAuthenticated={true} redirectTo="/">
                <Register />
              </PublicRoute>
            }
          />
        
          {/* Rota protegida - dashboard (somente para logados) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Redireciona rotas não encontradas para home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};