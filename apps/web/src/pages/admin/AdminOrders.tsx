import React, { useEffect, useState } from 'react';
import { Order } from '../../types/order';
import { Product } from '../../types/products';
import { apiService } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { Package, Calendar, CreditCard, Truck, Loader, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, ImageIcon, PlusCircle } from 'lucide-react';
import { SimpleOrderModal } from '../../components/admin/SimpleOrderModal';
import { AddressDisplay } from '../../components/common/AddressDisplay';
import { toast } from 'react-toastify';

const formatPrice = (price: string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseFloat(price));
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusInfo = (status: Order['status']) => {
  const statusMap = {
    'pendente': {
      label: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="h-4 w-4" />
    },
    'confirmado': {
      label: 'Confirmado',
      color: 'bg-blue-100 text-blue-800',
      icon: <Loader className="h-4 w-4" />
    },
    'enviado': {
      label: 'Enviado',
      color: 'bg-purple-100 text-purple-800',
      icon: <Truck className="h-4 w-4" />
    },
    'entregue': {
      label: 'Entregue',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="h-4 w-4" />
    },
    'cancelado': {
      label: 'Cancelado',
      color: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-4 w-4" />
    }
  };
  
  return statusMap[status] || statusMap['pendente'];
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: any[] }>({});
  const [loadingItems, setLoadingItems] = useState<{ [orderId: string]: boolean }>({});
  
  // Estados para o modal de pedido simples
  const [isSimpleOrderModalOpen, setIsSimpleOrderModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ success: boolean; data: { orders: Order[] } }>(`${API_ENDPOINTS.ADMIN_ORDERS}`);
      if (response.success && response.data) {
        setOrders(response.data.orders);
      }
    } catch (err) {
      setError('Erro ao carregar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      setLoadingItems(prev => ({ ...prev, [orderId]: true }));
      const response = await apiService.getOrderItems(orderId);
      if (response.success && response.data?.items) {
        setOrderItems(prev => ({ ...prev, [orderId]: response.data.items }));
      }
    } catch (err) {
      toast.error('Erro ao carregar itens do pedido');
      console.error(err);
    } finally {
      setLoadingItems(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      if (!orderItems[orderId]) {
        fetchOrderItems(orderId);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiService.getProducts(1, 100);
      if (response.success && response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (err) {
      toast.error('Erro ao carregar produtos');
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenSimpleOrderModal = async () => {
    if (products.length === 0) {
      await fetchProducts();
    }
    setIsSimpleOrderModalOpen(true);
  };

  const handleSimpleOrderSuccess = () => {
    fetchAdminOrders();
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: 'confirmado' | 'enviado' | 'cancelado') => {
    try {
      setUpdatingOrderId(orderId);
      if (status === 'cancelado') {
        await apiService.cancelOrder(orderId);
      } else {
        await apiService.updateOrderStatus(orderId, status);
      }
      await fetchAdminOrders();
      toast.success(`Pedido ${status} com sucesso!`);
    } catch (err) {
      toast.error('Erro ao atualizar o status do pedido');
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Pedidos</h1>
            <p className="text-gray-600 mt-1">
              {orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
            </p>
          </div>
          <button
            onClick={handleOpenSimpleOrderModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Criar Pedido Simples
          </button>
        </div>

        {/* Modal de Pedido Simples */}
        <SimpleOrderModal
          isOpen={isSimpleOrderModalOpen}
          onClose={() => setIsSimpleOrderModalOpen(false)}
          onSuccess={handleSimpleOrderSuccess}
          products={products}
          isLoading={loadingProducts}
        />

        <div className="space-y-6">
          {orders?.map((order: Order) => {
            const statusInfo = getStatusInfo(order.status);
            const isExpanded = expandedOrderId === order.id;
            const isLoadingOrder = loadingItems[order.id];
            const items = orderItems[order.id] || [];
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  {/* Cabeçalho do pedido */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Package className="h-6 w-6 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.id.slice(0, 8)}
                        </h3>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {order.user_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.user_phone} • {order.user_email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span className="ml-2">{statusInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações do pedido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
                    <div className="flex items-center space-x-3 lg:col-span-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Data do pedido</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 lg:col-span-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Itens</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.items_count} {parseInt(order.items_count) === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 lg:col-span-2">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(order.total_price)}
                        </p>
                      </div>
                    </div>

                    {/* Endereço de entrega */}
                    <div className="flex items-start space-x-3 lg:col-span-6">
                      <Truck className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Endereço de entrega</p>
                        <AddressDisplay addressId={order.address_id} />
                      </div>
                    </div>
                  </div>

                  {/* Ações do pedido */}
                  <div className="flex gap-2 mb-4">
                    {order.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmado')}
                          disabled={updatingOrderId === order.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                        >
                          Confirmar Pedido
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelado')}
                          disabled={updatingOrderId === order.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                        >
                          Cancelar Pedido
                        </button>
                      </>
                    )}
                    {order.status === 'confirmado' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'enviado')}
                          disabled={updatingOrderId === order.id}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                          Marcar como Enviado
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelado')}
                          disabled={updatingOrderId === order.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                        >
                          Cancelar Pedido
                        </button>
                      </>
                    )}
                  </div>

                  {/* Botão para expandir/colapsar */}
                  <button
                    onClick={() => toggleOrderDetails(order.id)}
                    className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="mr-2">
                      {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes do pedido'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* Seção expandível com os itens */}
                  <div className={`mt-4 transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    {isExpanded && (
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Itens do Pedido
                        </h4>
                        
                        {isLoadingOrder ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader className="h-8 w-8 animate-spin text-blue-500" />
                            <span className="ml-3 text-gray-600">Carregando itens...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
                                {/* Imagem do produto */}
                                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                  {item.product_image_url ? (
                                    <img
                                      src={item.product_image_url}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                {/* Informações do produto */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 truncate">
                                    {item.product_name}
                                  </h5>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-sm text-gray-500">
                                      Qtd: {item.quantity}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {formatPrice(item.price)} cada
                                    </span>
                                  </div>
                                </div>

                                {/* Subtotal */}
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Subtotal</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatPrice(item.subtotal)}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Resumo do pedido */}
                            <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal:</span>
                                  <span className="font-medium">
                                    {formatPrice(
                                      items.reduce((acc, item) => 
                                        acc + parseFloat(item.subtotal), 0
                                      ).toString()
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Frete:</span>
                                  <span className="font-medium">{formatPrice(order.shipping_price)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                  <span className="font-semibold text-lg text-gray-900">Total:</span>
                                  <span className="font-bold text-lg text-green-600">
                                    {formatPrice(order.total_price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
