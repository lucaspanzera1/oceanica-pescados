import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useOrders } from '../context/OrderContext';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, Loader, MapPin } from 'lucide-react';
import { AddressSelection } from '../components/address/AddressSelection';
import { Address } from '../types/address.types';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading, error, updateQuantity, removeItem, clearCart } = useCart();
  const { success, error: showError } = useToast();
  
  const { createOrder } = useOrders();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Estados para controlar loading de ações individuais
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [clearingCart, setClearingCart] = useState(false);


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number, maxStock: number, productName: string) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) {
      showError('Quantidade inválida', 'A quantidade deve ser pelo menos 1');
      return;
    }
    
    if (newQuantity > maxStock) {
      showError('Estoque insuficiente', `Temos apenas ${maxStock} unidades disponíveis`);
      return;
    }

    // Adicionar item ao set de loading
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      await updateQuantity(itemId, newQuantity);
      
      success(
        'Quantidade atualizada!',
        `${productName} - ${newQuantity} unidade${newQuantity > 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      showError(
        'Erro ao atualizar quantidade',
        'Tente novamente mais tarde'
      );
    } finally {
      // Remover item do set de loading
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string, productName: string) => {
    setRemovingItems(prev => new Set(prev).add(itemId));

    try {
      await removeItem(itemId);
      success(
        'Item removido!',
        `${productName} foi removido do carrinho`
      );
    } catch (error) {
      console.error('Erro ao remover item:', error);
      showError(
        'Erro ao remover item',
        'Tente novamente mais tarde'
      );
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    setClearingCart(true);

    try {
      await clearCart();
      success(
        'Carrinho limpo!',
        'Todos os itens foram removidos do carrinho'
      );
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      showError(
        'Erro ao limpar carrinho',
        'Tente novamente mais tarde'
      );
    } finally {
      setClearingCart(false);
    }
  };

const handleCheckout = async () => {
  if (!cart) return;
  
  if (!selectedAddress) {
    showError(
      'Endereço não selecionado',
      'Por favor, selecione um endereço de entrega para continuar'
    );
    return;
  }
  
  setCreatingOrder(true);
  
  try {
    const shippingPrice = 0.0; // Valor fixo do frete
    const newOrder = await createOrder(shippingPrice, selectedAddress.id);
    
    success(
      'Pedido criado com sucesso!',
      `Pedido #${newOrder.id} criado por ${formatPrice(Number(newOrder.total_price))}`
    );
    
    // Limpar o carrinho após criar o pedido
    await clearCart();
    
    // Redirecionar para a página de pedidos após 2 segundos
    setTimeout(() => {
      navigate('/orders');
    }, 2000);
    
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Carregando carrinho...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="mx-auto h-24 w-24 text-red-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Erro ao carregar carrinho
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
                  onClick={() => navigate('/products')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Continuar Comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrinho de Compras</h1>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Seu carrinho está vazio
              </h2>
              <p className="text-gray-600 mb-6">
                Adicione alguns produtos deliciosos ao seu carrinho para continuar.
              </p>
              <button
                onClick={() => navigate('/products')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Carrinho de Compras ({cart.summary.totalItems} {cart.summary.totalItems === 1 ? 'item' : 'itens'})
            </h1>
            <button
              onClick={() => navigate('/products')}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Continuar Comprando
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de itens */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const isUpdating = updatingItems.has(item.id);
                const isRemoving = removingItems.has(item.id);
                const isDisabled = isUpdating || isRemoving;

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-lg shadow-md p-6 transition-opacity ${
                      isDisabled ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Imagem do produto */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Sem+Imagem';
                          }}
                        />
                      </div>

                      {/* Informações do produto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(item.product.price)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Estoque: {item.product.stock}
                          </span>
                        </div>
                      </div>

                      {/* Controles de quantidade */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(
                            item.id, 
                            item.quantity, 
                            -1, 
                            item.product.stock,
                            item.product.name
                          )}
                          disabled={isDisabled || item.quantity <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isUpdating ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </button>
                        
                        <span className="text-lg font-semibold min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityChange(
                            item.id, 
                            item.quantity, 
                            1, 
                            item.product.stock,
                            item.product.name
                          )}
                          disabled={isDisabled || item.quantity >= item.product.stock}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isUpdating ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Subtotal e remover */}
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(item.subtotal)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.product.name)}
                          disabled={isDisabled}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remover item"
                        >
                          {isRemoving ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botão limpar carrinho */}
              <div className="flex justify-end">
                <button
                  onClick={handleClearCart}
                  disabled={clearingCart}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {clearingCart && <Loader className="h-4 w-4 animate-spin" />}
                  <span>Limpar Carrinho</span>
                </button>
              </div>
            </div>

            {/* Resumo do pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resumo do Pedido
                </h2>
                
                {/* Address Selection */}
                <div className="mb-6">
                  <AddressSelection
                    onAddressSelect={setSelectedAddress}
                    selectedAddressId={selectedAddress?.id}
                  />
                </div>

                {/* Order Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.summary.totalItems} {cart.summary.totalItems === 1 ? 'item' : 'itens'})</span>
                    <span>{formatPrice(cart.summary.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span className="text-green-600 font-medium">Grátis</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(cart.summary.totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={creatingOrder}
                  className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors mb-3 ${
                    creatingOrder 
                      ? 'bg-gray-400 cursor-not-allowed text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {creatingOrder ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Criando Pedido...</span>
                    </div>
                  ) : (
                    'Finalizar Compra'
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/products')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Continuar Comprando
                </button>

                {/* Informações adicionais */}
                <div className="mt-6 text-xs text-gray-500 space-y-1">
                  <p>✓ Frete grátis para todo o Brasil</p>
                  <p>✓ Produtos frescos e selecionados</p>
                  <p>✓ Entrega rápida e segura</p>
                  <p>✓ 7 dias para trocas e devoluções</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};