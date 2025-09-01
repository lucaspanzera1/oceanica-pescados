import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { Cart, CartItem, AddToCartRequest } from '../types/cart';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

interface CartContextType extends CartState {
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, setState] = useState<CartState>({
    cart: null,
    loading: true,
    error: null
  });

  const fetchCart = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiService.getCart();
      setState(prev => ({
        ...prev,
        cart: response.data.cart,
        loading: false
      }));
    } catch (error) {
      // Se der erro 404 (carrinho vazio), não é um erro real
      if (error instanceof Error && error.message.includes('404')) {
        setState(prev => ({
          ...prev,
          cart: {
            userId: '',
            items: [],
            summary: {
              totalItems: 0,
              totalAmount: 0,
              itemCount: 0
            }
          },
          loading: false,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Erro ao carregar carrinho',
          loading: false
        }));
      }
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const request: AddToCartRequest = { productId, quantity };
      await apiService.addToCart(request);
      
      // Recarrega o carrinho após adicionar
      await fetchCart();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao adicionar produto ao carrinho'
      }));
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      
      await apiService.updateCartItem(itemId, quantity);
      
      // Recarrega o carrinho após atualizar
      await fetchCart();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao atualizar quantidade'
      }));
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await apiService.removeCartItem(itemId);
      
      // Recarrega o carrinho após remover
      await fetchCart();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao remover produto'
      }));
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await apiService.clearCart();
      
      // Recarrega o carrinho após limpar
      await fetchCart();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao limpar carrinho'
      }));
      throw error;
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  // Carrega o carrinho quando o componente é montado
  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};