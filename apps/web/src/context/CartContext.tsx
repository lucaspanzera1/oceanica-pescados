import React, { createContext, useContext, useReducer, ReactNode } from 'react';
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
  | { type: 'CLEAR_CART' };

interface CartContextType extends CartState {
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
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
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
        };
      } else {
        // Se é um novo item, adiciona ao carrinho
        const newItem: CartItem = { ...product, quantity };
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
      };
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
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
      };
    }
    
    case 'CLEAR_CART': {
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0
      };
    }
    
    default:
      return state;
  }
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