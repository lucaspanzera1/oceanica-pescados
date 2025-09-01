import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle } from 'lucide-react';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading, error, updateQuantity, removeItem, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number, maxStock: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0 && newQuantity <= maxStock) {
      try {
        await updateQuantity(itemId, newQuantity);
      } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o carrinho?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
      }
    }
  };

  const handleCheckout = () => {
    if (!cart) return;
    alert(`Finalizar compra de ${cart.summary.totalItems} item(s) por ${formatPrice(cart.summary.totalAmount)}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              {cart.items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
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
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1, item.product.stock)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="text-lg font-semibold min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1, item.product.stock)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Subtotal e remover */}
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(item.subtotal)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botão limpar carrinho */}
              <div className="flex justify-end">
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  Limpar Carrinho
                </button>
              </div>
            </div>

            {/* Resumo do pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resumo do Pedido
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.summary.totalItems} {cart.summary.totalItems === 1 ? 'item' : 'itens'})</span>
                    <span>{formatPrice(cart.summary.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span>Grátis</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(cart.summary.totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
                >
                  Finalizar Compra
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};