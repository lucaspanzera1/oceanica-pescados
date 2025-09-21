import React, { useState, useEffect } from 'react';
import { X, Loader, ImageIcon } from 'lucide-react';
import { Product, ProductsResponse } from '../../types/products';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';

interface CreateExternalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface ExternalCustomer {
  name: string;
  phone: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: string;
}

export function CreateExternalOrderModal({ isOpen, onClose, onOrderCreated }: CreateExternalOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customer, setCustomer] = useState<ExternalCustomer>({
    name: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts(1, 100); // Get up to 100 products
      if (response.success && response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  interface CreateExternalOrderResponse {
    success: boolean;
    message: string;
    data?: {
      orderId: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || quantity <= 0) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    try {
      setLoading(true);
      const orderData = {
        customer,
        items: [{
          productId: selectedProduct,
          quantity,
          price: product.price
        }] as OrderItem[]
      };

      const response = await apiService.post<CreateExternalOrderResponse>('/orders', {
        ...orderData,
        shipping_price: '0', // Adicione o preço do frete se necessário
        address: {
          street: customer.street,
          number: customer.number,
          complement: customer.complement,
          neighborhood: customer.neighborhood,
          city: customer.city,
          state: customer.state,
          zipcode: customer.zipcode
        },
        user_name: customer.name,
        user_phone: customer.phone,
        is_external: true // Flag para identificar que é um pedido externo
      });
      
      if (response.success) {
        toast.success('Pedido criado com sucesso!');
        onOrderCreated();
        onClose();
      } else {
        throw new Error(response.message || 'Erro ao criar pedido');
      }
    } catch (error) {
      toast.error('Erro ao criar pedido');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Criar Pedido Externo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Informações do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={customer.phone}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <h3 className="font-semibold">Endereço de Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Rua</label>
                <input
                  type="text"
                  name="street"
                  value={customer.street}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input
                  type="text"
                  name="number"
                  value={customer.number}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                <input
                  type="text"
                  name="complement"
                  value={customer.complement}
                  onChange={handleCustomerChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={customer.neighborhood}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input
                  type="text"
                  name="city"
                  value={customer.city}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input
                  type="text"
                  name="state"
                  value={customer.state}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <input
                  type="text"
                  name="zipcode"
                  value={customer.zipcode}
                  onChange={handleCustomerChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <h3 className="font-semibold">Selecione o Produto</h3>
            <div className="bg-gray-50 rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-600">Carregando produtos...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-gray-500">Nenhum produto encontrado</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto p-4">
                  {products.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProduct === product.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="aspect-square w-full mb-2 relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    {selectedProduct === product.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 truncate">{product.name}</h4>
                  <p className="text-sm font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(parseFloat(product.price))}
                  </p>
                  </div>
                ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                <div className="flex items-center space-x-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="rounded-full w-8 h-8 flex items-center justify-center border border-gray-300 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="block w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="rounded-full w-8 h-8 flex items-center justify-center border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Criando...
                </>
              ) : (
                'Criar Pedido'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}