import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';
import { Layout } from '../components/layout/Layout';
import { AddressForm } from '../components/address/AddressForm';
import { AddressList } from '../components/address/AddressList';
import { addressService } from '../services/address.service';
import { Address } from '../types/address.types';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleAddressSubmit = async (address: Address) => {
    await loadAddresses();
    setShowAddressForm(false);
  };

  const handleDeleteAddress = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este endereço?')) {
      try {
        await addressService.deleteAddress(id);
        await loadAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
      }
    }
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <Button onClick={handleLogout} variant="secondary">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações Pessoais
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
                    <span className="text-2xl text-gray-600">{user?.name?.[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{user?.name}</h3>
                    <p className="text-sm text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3">
                      <dt className="text-sm font-medium text-gray-500">Email:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{user?.email}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-sm font-medium text-gray-500">Telefone:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{user?.phone || 'Não informado'}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-sm font-medium text-gray-500">Membro desde:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : ''}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Endereços
                </h2>
                <Button
                  variant="primary"
                  onClick={() => setShowAddressForm(true)}
                >
                  Adicionar Endereço
                </Button>
              </div>
              {showAddressForm ? (
                <div className="mt-4">
                  <AddressForm
                    onSubmit={handleAddressSubmit}
                    onCancel={() => setShowAddressForm(false)}
                  />
                </div>
              ) : (
                <div className="mt-4">
                  {loading ? (
                    <div className="text-sm text-gray-500">Carregando endereços...</div>
                  ) : (
                    <AddressList
                      addresses={addresses}
                      onDelete={handleDeleteAddress}
                    />
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Preferências
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Receber notificações por email</span>
                  <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200">
                    <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ações da Conta
              </h2>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full text-left justify-start">
                  Alterar Senha
                </Button>
                <Button variant="danger" onClick={handleLogout} className="w-full text-left justify-start">
                  Sair da Conta
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
    </Layout>
  );
};