import React, { useState } from 'react';
import { Loader, ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../../../services/api';
import { Product } from '../../../types/products';

interface SimpleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  products: Product[];
  isLoading?: boolean;
}

export function SimpleOrderModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  isLoading = false
}: SimpleOrderModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }

    if (!username.trim()) {
      toast.error('Digite o nome do cliente');
      return;
    }

    if (!phone.trim()) {
      toast.error('Digite o telefone do cliente');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createSimpleOrder({
        productId: selectedProduct.id,
        username: username.trim(),
        phone: phone.trim()
      });

      if (response.success) {
        toast.success('Pedido criado com sucesso!');
        handleClose();
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setUsername('');
    setPhone('');
    onClose();
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Criar Pedido Simples
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campos do cliente */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Digite o nome do cliente"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Telefone
                      </label>
                      <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="(00) 00000-0000"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Seleção de produto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione o Produto
                    </label>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-600">Carregando produtos...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`cursor-pointer rounded-lg border p-4 transition-all ${
                              selectedProduct?.id === product.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">{formatPrice(product.price)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || isLoading}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Pedido'
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}