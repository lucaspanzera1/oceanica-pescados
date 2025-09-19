// AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Pages - Cliente
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';

// Pages - Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import ProductForm from './components/admin/products/ProductForm';

import { ToastContainer } from './components/ToastContainer';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <OrderProvider>
              <Routes>
                {/* ==================== ROTAS PÚBLICAS ==================== */}
                
                {/* Rota pública - página inicial */}
                <Route
                  path="/"
                  element={
                    <PublicRoute restrictWhenAuthenticated={false}>
                      <Home />
                    </PublicRoute>
                  }
                />
                
                {/* Rota de produto específico */}
                <Route
                  path="/produtos/:id"
                  element={
                    <PublicRoute>
                      <ProductDetail />
                    </PublicRoute>
                  }
                />
                
                {/* Rota do carrinho */}
                <Route
                  path="/cart"
                  element={
                    <PublicRoute>
                      <Cart />
                    </PublicRoute>
                  }
                />

                {/* Login e Register */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute restrictWhenAuthenticated={true} redirectTo="/">
                      <Login />
                    </PublicRoute>
                  }
                />
                
                <Route
                  path="/register"
                  element={
                    <PublicRoute restrictWhenAuthenticated={true} redirectTo="/">
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* ==================== ROTAS PROTEGIDAS - USUÁRIO ==================== */}
                
                {/* Dashboard do usuário */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Pedidos do usuário */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />

                {/* ==================== ROTAS ADMINISTRATIVAS ==================== */}
                
                {/* Layout administrativo com sub-rotas */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Routes>
                          <Route index element={<AdminDashboard />} />
                          <Route path="products" element={<AdminProducts />} />
                          <Route path="products/new" element={<ProductForm />} />
                          <Route path="products/edit/:id" element={<ProductForm />} />
                          <Route path="orders" element={<AdminOrders />} />
                          <Route path="users" element={<AdminUsers />} />
                          <Route path="reports" element={<AdminReports />} />
                          {/* Redireciona rotas admin não encontradas */}
                          <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                      </AdminLayout>
                    </AdminRoute>
                  }
                />

                {/* ==================== FALLBACK ==================== */}
                
                {/* Redireciona rotas não encontradas para home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <ToastContainer />
            </OrderProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};