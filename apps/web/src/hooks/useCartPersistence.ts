import { useEffect } from 'react';
import { CartState } from '../context/CartContext';

// Como não podemos usar localStorage em artifacts, vamos usar uma abordagem em memória
let cartMemoryStorage: CartState | null = null;

export const useCartPersistence = () => {
  // Função para salvar o carrinho em memória
  const saveCart = (cartState: CartState): void => {
    try {
      cartMemoryStorage = { ...cartState };
      console.log('Carrinho salvo em memória:', cartState);
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  // Função para carregar o carrinho da memória
  const loadCart = (): CartState | null => {
    try {
      if (cartMemoryStorage) {
        // Valida a estrutura do carrinho
        if (cartMemoryStorage && 
            Array.isArray(cartMemoryStorage.items) && 
            typeof cartMemoryStorage.totalItems === 'number' && 
            typeof cartMemoryStorage.totalPrice === 'number') {
          return cartMemoryStorage;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
    return null;
  };

  // Função para limpar o carrinho da memória
  const clearStoredCart = (): void => {
    try {
      cartMemoryStorage = null;
      console.log('Carrinho limpo da memória');
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }
  };

  // Função para verificar se há carrinho salvo
  const hasStoredCart = (): boolean => {
    try {
      return cartMemoryStorage !== null;
    } catch (error) {
      console.error('Erro ao verificar carrinho salvo:', error);
      return false;
    }
  };

  // Listener para mudanças no carrinho (simulado)
  useEffect(() => {
    const handleCartChange = () => {
      console.log('Carrinho atualizado');
    };

    // Simular listener de mudanças
    window.addEventListener('cartUpdated', handleCartChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartChange);
    };
  }, []);

  return {
    saveCart,
    loadCart,
    clearStoredCart,
    hasStoredCart
  };
};