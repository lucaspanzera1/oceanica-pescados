import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product } from '../types/product';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

interface CartContextType extends CartState {
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Chave para armazenar no localStorage
const CART_STORAGE_KEY = 'shopping_cart';

// Função para carregar o carrinho do localStorage
const loadCartFromStorage = (): CartState => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      // Valida se tem a estrutura esperada
      if (parsedCart && Array.isArray(parsedCart.items)) {
        return parsedCart;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar carrinho do localStorage:', error);
  }
  
  // Retorna estado inicial se não conseguir carregar
  return {
    items: [],
    totalItems: 0,
    totalPrice: 0
  };
};

// Função para salvar o carrinho no localStorage
const saveCartToStorage = (state: CartState): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar carrinho no localStorage:', error);
  }
};

// Função para calcular totais
const calculateTotals = (items: CartItem[]): { totalItems: number; totalPrice: number } => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  
  return { totalItems, totalPrice };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newState: CartState;

  switch (action.type) {
    case 'LOAD_CART': {
      return action.payload;
    }

    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === product.id);
      
      if (existingItemIndex > -1) {
        // Se o item já existe, atualiza a quantidade
        const updatedItems = [...state.items];
        const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
        
        // Verifica se não excede o estoque
        if (newQuantity <= product.stock) {
          updatedItems[existingItemIndex].quantity = newQuantity;
        } else {
          updatedItems[existingItemIndex].quantity = product.stock;
        }
        
        const totals = calculateTotals(updatedItems);
        newState = {
          ...state,
          items: updatedItems,
          ...totals
        };
      } else {
        // Se é um novo item, adiciona ao carrinho
        const newItem: CartItem = { ...product, quantity };
        const updatedItems = [...state.items, newItem];
        const totals = calculateTotals(updatedItems);
        
        newState = {
          ...state,
          items: updatedItems,
          ...totals
        };
      }
      break;
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const totals = calculateTotals(updatedItems);
      
      newState = {
        ...state,
        items: updatedItems,
        ...totals
      };
      break;
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Se a quantidade for 0 ou menor, remove o item
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: id });
      }
      
      const updatedItems = state.items.map(item => {
        if (item.id === id) {
          // Verifica se não excede o estoque
          const newQuantity = quantity <= item.stock ? quantity : item.stock;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      const totals = calculateTotals(updatedItems);
      newState = {
        ...state,
        items: updatedItems,
        ...totals
      };
      break;
    }
    
    case 'CLEAR_CART': {
      newState = {
        items: [],
        totalItems: 0,
        totalPrice: 0
      };
      break;
    }
    
    default:
      return state;
  }

  // Salva no localStorage sempre que o estado muda
  saveCartToStorage(newState);
  return newState;
};

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Carrega o carrinho do localStorage quando o componente monta
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    if (savedCart.items.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: savedCart });
    }
  }, []);
  
  const addItem = (product: Product, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart
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