import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { apiService } from '../services/api';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductDetailState {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { success, error } = useToast();
  
  const [state, setState] = useState<ProductDetailState>({
    product: null,
    loading: true,
    error: null
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = async () => {
    if (!id) {
      setState(prev => ({ ...prev, error: 'ID do produto não encontrado', loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiService.getProductById(id);
      
      setState(prev => ({
        ...prev,
        product: response.data.product,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao carregar produto',
        loading: false
      }));
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getImages = () => {
    if (!state.product) return [];
    const images = [state.product.image_url];
    if (state.product.image_url1) {
      images.push(state.product.image_url1);
    }
    return images;
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (state.product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };
  
const handleAddToCart = async () => {
  if (state.product) {
    try {
      await addToCart(state.product.id, quantity);
      
      success(
        'Produtos adicionados ao carrinho!',
        `${quantity} unidade${quantity > 1 ? 's' : ''} de ${state.product.name}`
      );
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    
      error(
        'Erro ao adicionar ao carrinho', 
        'Tente novamente mais tarde'
      );
    }
  }
};

  if (state.loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar produto</h2>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <div className="space-x-4">
              <button
                onClick={() => fetchProduct()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => navigate('/products')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Voltar aos produtos
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!state.product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar aos produtos
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const images = getImages();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8 text-sm">
            <button
              onClick={() => navigate('/products')}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Produtos
            </button>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-500">{state.product.name}</span>
          </nav>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
              {/* Galeria de imagens */}
              <div className="space-y-4">
                <div className="aspect-square w-full bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={state.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/500x500?text=Sem+Imagem';
                    }}
                  />
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex space-x-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${state.product.name} - Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações do produto */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {state.product.name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {state.product.description}
                  </p>
                </div>

                <div className="border-t border-b py-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {formatPrice(state.product.price)}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    state.product.stock > 10 
                      ? 'bg-green-100 text-green-800' 
                      : state.product.stock > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {state.product.stock > 0 
                      ? `${state.product.stock} em estoque` 
                      : 'Fora de estoque'
                    }
                  </div>
                </div>

                {/* Controle de quantidade e adicionar ao carrinho */}
                {state.product.stock > 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="text-xl font-semibold min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= state.product.stock}
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      Adicionar ao Carrinho
                    </button>
                  </div>
                )}

                {/* Informações adicionais */}
                <div className="space-y-3 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900">Informações do Produto</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Criado em:</strong> {formatDate(state.product.created_at)}</p>
                    <p><strong>Última atualização:</strong> {formatDate(state.product.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};