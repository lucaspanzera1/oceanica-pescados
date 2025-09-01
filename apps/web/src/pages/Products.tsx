import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Product, Pagination } from '../types/product';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductsState {
  products: Product[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart(); // ✅ Mudado para addToCart (consistente com ProductDetail)
  const { success, error } = useToast();
  
  const [state, setState] = useState<ProductsState>({
    products: [],
    pagination: null,
    loading: true,
    error: null
  });

  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = async (page: number = 1) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiService.getProducts(page);
      
      setState(prev => ({
        ...prev,
        products: response.data.products,
        pagination: response.data.pagination,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao carregar produtos',
        loading: false
      }));
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // ✅ Função corrigida - recebe product e event, não usa state.product
  const handleAddToCart = async (product: Product, event: React.MouseEvent) => {
    // Previne que o clique no botão também dispare o clique no card
    event.stopPropagation();
    
    if (product && product.stock > 0) {
      try {
        await addToCart(product.id, 1); // Adiciona 1 unidade por padrão
        
        success(
          'Produto adicionado ao carrinho!',
          `1 unidade de ${product.name}`
        );
        
      } catch (err) {
        console.error('Erro ao adicionar ao carrinho:', err);
        
        error(
          'Erro ao adicionar ao carrinho', 
          'Tente novamente mais tarde'
        );
      }
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/produtos/${productId}`);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price));
  };

  if (state.loading) {
    return (
        <div className="min-h-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  if (state.error) {
    return (
        <div className="min-h-auto flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar produtos</h2>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <button
              onClick={() => fetchProducts(currentPage)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-auto bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Nossos Produtos</h1>
            <p className="text-xl text-gray-600">Frutos do mar frescos e de qualidade</p>
          </div>

          {state.products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">Nenhum produto encontrado</p>
            </div>
          ) : (
            <>
              {/* Grid de produtos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {state.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="aspect-w-1 aspect-h-1 w-full h-48 bg-gray-200 relative overflow-hidden">
                      {/* Primeira imagem */}
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                          product.image_url1 ? 'group-hover:opacity-0' : ''
                        }`}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                        }}
                      />
                      
                      {/* Segunda imagem (se existir) */}
                      {product.image_url1 && (
                        <img
                          src={product.image_url1}
                          alt={`${product.name} - Vista alternativa`}
                          className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      
                      {/* Indicador de múltiplas imagens */}
                      {product.image_url1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          2 fotos
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(product.price)}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stock > 0 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
                        </span>
                      </div>
                      
                      <button
                        disabled={product.stock === 0}
                        onClick={(e) => handleAddToCart(product, e)}
                        className={`w-full py-2 px-4 rounded-lg transition-colors ${
                          product.stock > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {state.pagination && state.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!state.pagination.hasPreviousPage}
                    className={`px-4 py-2 rounded-lg ${
                      state.pagination.hasPreviousPage
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Anterior
                  </button>
                  
                  <span className="px-4 py-2 text-gray-700">
                    Página {state.pagination.currentPage} de {state.pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!state.pagination.hasNextPage}
                    className={`px-4 py-2 rounded-lg ${
                      state.pagination.hasNextPage
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Próxima
                  </button>
                </div>
              )}

              {/* Info da paginação */}
              {state.pagination && (
                <div className="text-center mt-4 text-gray-600">
                  Mostrando {state.products.length} de {state.pagination.totalItems} produtos
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
};