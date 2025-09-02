import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useOrders } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  Loader, 
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Order, OrderItem } from '../types/order';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading, error, pagination, createOrder, fetchOrders, getOrderItems, cancelOrder } = useOrders();
  const { cart, clearCart } = useCart();
  const { success, error: showError } = useToast();
  
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  
  // Estados para controle dos pedidos expandidos
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

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
      'processando': {
        label: 'Processando',
        color: 'bg-blue-100 text-blue-800',
        icon: <Loader className="h-4 w-4 animate-spin" />
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

  const canCancelOrder = (status: Order['status']) => {
    return status === 'pendente' || status === 'processando';
  };

  const handleCreateOrder = async () => {
    if (!cart || cart.items.length === 0) {
      showError(
        'Carrinho vazio',
        'Adicione produtos ao carrinho antes de criar um pedido'
      );
      return;
    }

    setCreatingOrder(true);
    try {
      const shippingPrice = 15.50;
      const newOrder = await createOrder(shippingPrice);
      
      await clearCart();
      
      success(
        'Pedido criado com sucesso!',
        `Pedido #${newOrder.id.slice(0, 8)} criado por ${formatPrice(newOrder.total_price)}`
      );
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      showError(
        'Erro ao criar pedido',
        'Tente novamente mais tarde'
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;
    
    setLoadingPage(true);
    try {
      await fetchOrders(page);
    } catch (error) {
      console.error('Erro ao carregar página:', error);
      showError('Erro ao carregar página', 'Tente novamente');
    } finally {
      setLoadingPage(false);
    }
  };

  const toggleOrderExpansion = async (orderId: string) => {
    const isExpanded = expandedOrders.has(orderId);
    
    if (isExpanded) {
      // Colapsar
      const newExpanded = new Set(expandedOrders);
      newExpanded.delete(orderId);
      setExpandedOrders(newExpanded);
    } else {
      // Expandir - buscar itens se ainda não foram carregados
      if (!orderItems[orderId]) {
        setLoadingItems(prev => new Set(prev).add(orderId));
        
        try {
          const items = await getOrderItems(orderId);
          setOrderItems(prev => ({ ...prev, [orderId]: items }));
        } catch (error) {
          console.error('Erro ao carregar itens:', error);
          showError('Erro ao carregar itens', 'Tente novamente');
          return;
        } finally {
          setLoadingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
          });
        }
      }
      
      const newExpanded = new Set(expandedOrders);
      newExpanded.add(orderId);
      setExpandedOrders(newExpanded);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      return;
    }

    setCancellingOrders(prev => new Set(prev).add(orderId));

    try {
      await cancelOrder(orderId);
      success(
        'Pedido cancelado!',
        `Pedido #${orderNumber} foi cancelado com sucesso`
      );
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      showError(
        'Erro ao cancelar pedido',
        'Tente novamente mais tarde'
      );
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && orders.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="mx-auto h-24 w-24 text-red-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Erro ao carregar pedidos
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Ver Carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-gray-600 mt-1">
                {pagination ? `${pagination.totalItems} ${pagination.totalItems === 1 ? 'pedido encontrado' : 'pedidos encontrados'}` : ''}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/cart')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Ver Carrinho</span>
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={creatingOrder || !cart || cart.items.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
              >
                {creatingOrder ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span>
                  {creatingOrder ? 'Criando...' : 'Criar Pedido'}
                </span>
              </button>
            </div>
          </div>

          {/* Resumo do carrinho atual */}
          {cart && cart.items.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Carrinho atual: {cart.summary.totalItems} {cart.summary.totalItems === 1 ? 'item' : 'itens'}
                    </h3>
                    <p className="text-blue-700">
                      Total: {formatPrice(cart.summary.totalAmount.toString())} + Frete: R$ 15,50
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 mb-2">
                    Clique em "Criar Pedido" para finalizar sua compra
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    Total: {formatPrice((cart.summary.totalAmount + 15.50).toString())}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de pedidos */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Package className="mx-auto h-24 w-24 text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h2>
              <p className="text-gray-600 mb-6">
                Você ainda não fez nenhum pedido. Que tal começar adicionando produtos ao carrinho?
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/products')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Explorar Produtos
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Ver Carrinho
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const isExpanded = expandedOrders.has(order.id);
                const isLoadingItems = loadingItems.has(order.id);
                const isCancelling = cancellingOrders.has(order.id);
                const items = orderItems[order.id] || [];
                
                return (
                  <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      {/* Header do pedido */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Package className="h-6 w-6 text-gray-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Pedido #{order.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {order.user_email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Botão de cancelar pedido */}
                          {canCancelOrder(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order.id, order.id.slice(0, 8))}
                              disabled={isCancelling}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                              title="Cancelar pedido"
                            >
                              {isCancelling ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span className="text-sm">Cancelar</span>
                            </button>
                          )}
                          
                          {/* Status do pedido */}
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            <span className="ml-2">{statusInfo.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Informações do pedido */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Data do pedido</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Itens</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.items_count} {parseInt(order.items_count) === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Truck className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Frete</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatPrice(order.shipping_price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatPrice(order.total_price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Atualização */}
                      {order.updated_at !== order.created_at && (
                        <div className="text-xs text-gray-500 mb-4">
                          Atualizado em: {formatDate(order.updated_at)}
                        </div>
                      )}

                      {/* Botão para expandir/colapsar */}
                      <div className="border-t pt-4">
                        <button
                          onClick={() => toggleOrderExpansion(order.id)}
                          disabled={isLoadingItems}
                          className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingItems ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin mr-2" />
                              <span>Carregando itens...</span>
                            </>
                          ) : (
                            <>
                              <span className="mr-2">
                                {isExpanded ? 'Ocultar itens' : 'Ver itens do pedido'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Itens do pedido (accordion) */}
                    <div className={`border-t bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden ${
                      isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {isExpanded && items.length > 0 && (
                        <div className="p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Itens do Pedido
                          </h4>
                          
                          {/* Lista de itens */}
                          <div className="space-y-4">
                            {items.map((item, index) => (
                              <div key={index} className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
                                {/* Imagem do produto */}
                                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                  {item.product_image_url ? (
                                    <img
                                      src={item.product_image_url}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-full h-full flex items-center justify-center ${item.product_image_url ? 'hidden' : 'flex'}`}>
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                </div>

                                {/* Informações do produto */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 truncate">
                                    {item.product_name}
                                  </h5>
                                  {item.product_description && (
                                    <p className="text-sm text-gray-500 truncate">
                                      {item.product_description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-sm text-gray-500">
                                      Qtd: {item.quantity}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {formatPrice(item.unit_price)} cada
                                    </span>
                                  </div>
                                </div>

                                {/* Subtotal */}
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Subtotal</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatPrice((parseFloat(item.unit_price) * parseInt(item.quantity)).toString())}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Resumo do pedido */}
                          <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal dos itens:</span>
                                <span className="font-medium">
                                  {formatPrice(
                                    items.reduce((acc, item) => 
                                      acc + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 bg-white px-4 py-3 rounded-lg shadow-md">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Mostrando página {pagination.currentPage} de {pagination.totalPages}
                  {' '}({pagination.totalItems} {pagination.totalItems === 1 ? 'pedido' : 'pedidos'} total)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loadingPage}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Anterior</span>
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loadingPage}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loadingPage}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-1">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Loading de página */}
          {loadingPage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-900">Carregando página...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};