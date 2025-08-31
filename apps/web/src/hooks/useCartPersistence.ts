import { useEffect } from 'react';
import { CartState } from '../context/CartContext';

const CART_STORAGE_KEY = 'shopping_cart';

export const useCartPersistence = () => {
  // Função para salvar o carrinho
  const saveCart = (cartState: CartState): void => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  // Função para carregar o carrinho
  const loadCart = (): CartState | null => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Valida a estrutura do carrinho
        if (parsedCart && 
            Array.isArray(parsedCart.items) && 
            typeof parsedCart.totalItems === 'number' && 
            typeof parsedCart.totalPrice === 'number') {
          return parsedCart;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
    return null;
  };

  // Função para limpar o carrinho do localStorage
  const clearStoredCart = (): void => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }
  };

  // Função para verificar se há carrinho salvo
  const hasStoredCart = (): boolean => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart !== null && savedCart !== '';
    } catch (error) {
      console.error('Erro ao verificar carrinho salvo:', error);
      return false;
    }
  };

  // Listener para mudanças no localStorage (útil para sincronizar entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        // Pode disparar um evento customizado ou callback aqui
        // para sincronizar o estado entre diferentes abas
        console.log('Carrinho atualizado em outra aba');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    saveCart,
    loadCart,
    clearStoredCart,
    hasStoredCart
  };
};