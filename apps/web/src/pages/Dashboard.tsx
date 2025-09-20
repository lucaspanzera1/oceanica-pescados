import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';
import { Layout } from '../components/layout/Layout';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button onClick={handleLogout} variant="secondary">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informações do Usuário
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Telefone:</strong> {user?.phone || 'Não informado'}</p>
              <p><strong>Tipo:</strong> {user?.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
              <p><strong>Criado em:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : ''}</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Status da Sessão
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Conectado</span>
              </div>
              <p className="text-gray-600">Sessão ativa desde o login</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h2>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full text-left justify-start">
                Ver Perfil
              </Button>
              <Button variant="secondary" className="w-full text-left justify-start">
                Configurações
              </Button>
              <Button variant="danger" onClick={handleLogout} className="w-full text-left justify-start">
                Sair da Conta
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
    </Layout>
  );
};