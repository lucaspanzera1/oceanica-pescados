import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { Order, CreateOrderRequest, OrderItem } from '../types/order';
import { useOrderPersistence } from '../hooks/useOrderPersistence';
import { useAuth } from '../hooks/useAuth';

export interface OrderState {
  orders: Order[];
  totalOrders: number;
  currentPage: number;
}

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  createOrder: (shippingPrice: number, addressId: string) => Promise<Order>;
  fetchOrders: (page?: number) => Promise<void>;
  refreshOrders: () => Promise<void>;
  getOrderItems: (orderId: string) => Promise<OrderItem[]>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'SET_ORDERS' | 'CLEAR_ERROR' | 'ADD_ORDER' | 'UPDATE_ORDER';
  payload?: any;
}

interface OrderReducerState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
}

const orderReducer = (state: OrderReducerState, action: OrderAction): OrderReducerState => {
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
    case 'SET_ORDERS':
      return {
        ...state,
        loading: false,
        error: null,
        orders: action.payload.orders,
        pagination: action.payload.pagination
      };
    case 'ADD_ORDER':
      return {
        ...state,
        loading: false,
        error: null,
        orders: [action.payload, ...state.orders],
        pagination: state.pagination ? {
          ...state.pagination,
          totalItems: state.pagination.totalItems + 1
        } : null
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        loading: false,
        error: null,
        orders: state.orders.map(order => 
          order.id === action.payload.id ? action.payload : order
        )
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

const initialState: OrderReducerState = {
  orders: [],
  loading: true,
  error: null,
  pagination: null
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { saveOrders, loadOrders } = useOrderPersistence();
  const { isAuthenticated } = useAuth();

  // Função para buscar pedidos
  const fetchOrders = async (page: number = 1): Promise<void> => {
    try {
      // Se não estiver autenticado, não faz chamada à API
      if (!isAuthenticated) {
        dispatch({ type: 'SET_ORDERS', payload: { orders: [], pagination: null } });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.getOrders(page);
      
      if (response.success && response.data) {
        dispatch({ 
          type: 'SET_ORDERS', 
          payload: {
            orders: response.data.orders,
            pagination: response.data.pagination
          }
        });
        
        // Salvar no storage local
        const orderState: OrderState = {
          orders: response.data.orders,
          totalOrders: response.data.pagination.totalItems,
          currentPage: response.data.pagination.currentPage
        };
        saveOrders(orderState);
      } else {
        throw new Error(response.message || 'Erro ao carregar pedidos');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar pedidos';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Tentar carregar do storage local em caso de erro
      const savedOrders = loadOrders();
      if (savedOrders && savedOrders.orders.length > 0) {
        dispatch({ 
          type: 'SET_ORDERS', 
          payload: {
            orders: savedOrders.orders,
            pagination: {
              currentPage: savedOrders.currentPage,
              totalPages: Math.ceil(savedOrders.totalOrders / 10),
              totalItems: savedOrders.totalOrders,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        });
        console.log('Pedidos carregados do storage local:', savedOrders);
      }
    }
  };

  // Função para criar um novo pedido
  const createOrder = async (shippingPrice: number, addressId: string): Promise<Order> => {
    if (!isAuthenticated) {
      throw new Error('Usuário não está autenticado');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const request: CreateOrderRequest = {
        shipping_price: shippingPrice,
        address_id: addressId
      };
      
      const response = await apiService.createOrder(request);
      
      if (response.success && response.data?.order) {
        const newOrder = response.data.order;
        
        // Adicionar o novo pedido à lista
        dispatch({ type: 'ADD_ORDER', payload: newOrder });
        
        // Atualizar storage local
        const updatedOrders = [newOrder, ...state.orders];
        const orderState: OrderState = {
          orders: updatedOrders,
          totalOrders: (state.pagination?.totalItems || 0) + 1,
          currentPage: 1
        };
        saveOrders(orderState);
        
        return newOrder;
      } else {
        throw new Error(response.message || 'Erro ao criar pedido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pedido';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Função para recarregar pedidos
  const refreshOrders = async (): Promise<void> => {
    await fetchOrders(state.pagination?.currentPage || 1);
  };

  // Função para buscar itens de um pedido
  const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    if (!isAuthenticated) {
      throw new Error('Usuário não está autenticado');
    }

    try {
      const response = await apiService.getOrderItems(orderId);
      
      if (response.success && response.data?.items) {
        return response.data.items;
      } else {
        throw new Error(response.message || 'Erro ao carregar itens do pedido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar itens do pedido';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Função para cancelar um pedido
  const cancelOrder = async (orderId: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Usuário não está autenticado');
    }

    try {
      const response = await apiService.cancelOrder(orderId);
      
      if (response.success) {
        // Atualizar o pedido na lista local (mudando status para cancelado)
        const updatedOrders = state.orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelado' as const, updated_at: new Date().toISOString() }
            : order
        );
        
        dispatch({ 
          type: 'SET_ORDERS', 
          payload: {
            orders: updatedOrders,
            pagination: state.pagination
          }
        });
        
        // Atualizar storage local
        const orderState: OrderState = {
          orders: updatedOrders,
          totalOrders: state.pagination?.totalItems || 0,
          currentPage: state.pagination?.currentPage || 1
        };
        saveOrders(orderState);
      } else {
        throw new Error(response.message || 'Erro ao cancelar pedido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cancelar pedido';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Carregar pedidos na inicialização e quando o estado de autenticação mudar
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      // Se não estiver autenticado, limpa os pedidos
      dispatch({ type: 'SET_ORDERS', payload: { orders: [], pagination: null } });
    }
  }, [isAuthenticated]);

  const value: OrderContextType = {
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    createOrder,
    fetchOrders,
    refreshOrders,
    getOrderItems,
    cancelOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders deve ser usado dentro de um OrderProvider');
  }
  return context;
};