import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { Cart } from '../types/cart';
import { useCartPersistence } from '../hooks/useCartPersistence';
import { useAuth } from '../hooks/useAuth';

export interface CartState {
  items: any[];
  totalItems: number;
  totalPrice: number;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  totalItems: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'SET_CART' | 'CLEAR_ERROR';
  payload?: any;
}

interface CartReducerState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const cartReducer = (state: CartReducerState, action: CartAction): CartReducerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'SET_CART':
      return {
        ...state,
        loading: false,
        error: null,
        cart: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState: CartReducerState = {
  cart: null,
  loading: true,
  error: null
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { saveCart, loadCart } = useCartPersistence();
  const { isAuthenticated } = useAuth();

  // Função para carregar o carrinho
  const fetchCart = async (): Promise<void> => {
    try {
      // Se não estiver autenticado, apenas carrega do storage local
      if (!isAuthenticated) {
        const savedCart = loadCart();
        if (savedCart) {
          console.log('Carregado do storage local:', savedCart);
          return;
        }
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.getCart();
      
      if (response.success && response.data?.cart) {
        dispatch({ type: 'SET_CART', payload: response.data.cart });
        
        // Salvar no storage local
        const cartState: CartState = {
          items: response.data.cart.items,
          totalItems: response.data.cart.summary.totalItems,
          totalPrice: response.data.cart.summary.totalAmount
        };
        saveCart(cartState);
      } else {
        throw new Error(response.message || 'Erro ao carregar carrinho');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar carrinho';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Tentar carregar do storage local em caso de erro
      const savedCart = loadCart();
      if (savedCart) {
        console.log('Carregado do storage local:', savedCart);
      }
    }
  };

  // Função para adicionar item ao carrinho
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      const response = await apiService.addToCart({ productId, quantity });
      
      if (response.success) {
        // Recarregar o carrinho após adicionar
        await fetchCart();
      } else {
        throw new Error(response.message || 'Erro ao adicionar item ao carrinho');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar item ao carrinho';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Função para atualizar quantidade de um item - CORRIGIDA
  const updateQuantity = async (itemId: string, quantity: number): Promise<void> => {
    try {
      // Encontrar o produto pelo itemId para obter o productId
      const item = state.cart?.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item não encontrado no carrinho');
      }
      
      // Usar o productId para a requisição
      const response = await apiService.updateCartItem(item.productId, quantity);
      
      if (response.success) {
        // Recarregar o carrinho após atualizar
        await fetchCart();
      } else {
        throw new Error(response.message || 'Erro ao atualizar quantidade');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar quantidade';
      console.error('Erro ao atualizar quantidade:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Função para remover item do carrinho - CORRIGIDA
  const removeItem = async (itemId: string): Promise<void> => {
    try {
      // Encontrar o produto pelo itemId para obter o productId
      const item = state.cart?.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item não encontrado no carrinho');
      }
      
      // Usar o productId para a requisição
      const response = await apiService.removeCartItem(item.productId);
      
      if (response.success) {
        // Recarregar o carrinho após remover
        await fetchCart();
      } else {
        throw new Error(response.message || 'Erro ao remover item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover item';
      console.error('Erro ao remover item:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Função para limpar o carrinho
  const clearCart = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.clearCart();
      
      if (response.success) {
        // Criar um carrinho vazio com a estrutura correta
        const emptyCart: Cart = {
          userId: state.cart?.userId || '',
          items: [],
          summary: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 0
          }
        };
        
        dispatch({ type: 'SET_CART', payload: emptyCart });
        
        // Limpar do storage local
        const emptyCartState: CartState = {
          items: [],
          totalItems: 0,
          totalPrice: 0
        };
        saveCart(emptyCartState);
      } else {
        throw new Error(response.message || 'Erro ao limpar carrinho');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao limpar carrinho';
      console.error('Erro ao limpar carrinho:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Função para recarregar o carrinho
  const refreshCart = async (): Promise<void> => {
    await fetchCart();
  };

  // Carregar carrinho na inicialização e quando o estado de autenticação mudar
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Se não estiver autenticado, apenas tenta carregar do storage local
      const savedCart = loadCart();
      if (savedCart) {
        dispatch({ type: 'SET_CART', payload: savedCart });
      }
    }
  }, [isAuthenticated]);

  // Auto-refresh do carrinho a cada 30 segundos (apenas se autenticado)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!state.loading) {
        fetchCart();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.loading, isAuthenticated]);

  const value: CartContextType = {
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    totalItems: state.cart?.summary.totalItems || 0,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};