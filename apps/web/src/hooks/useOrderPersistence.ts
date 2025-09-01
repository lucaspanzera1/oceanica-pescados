import { useEffect } from 'react';
import { OrderState } from '../context/OrderContext';

// Como não podemos usar localStorage em artifacts, vamos usar uma abordagem em memória
let orderMemoryStorage: OrderState | null = null;

export const useOrderPersistence = () => {
  // Função para salvar os pedidos em memória
  const saveOrders = (orderState: OrderState): void => {
    try {
      orderMemoryStorage = { ...orderState };
      console.log('Pedidos salvos em memória:', orderState);
    } catch (error) {
      console.error('Erro ao salvar pedidos:', error);
    }
  };

  // Função para carregar os pedidos da memória
  const loadOrders = (): OrderState | null => {
    try {
      if (orderMemoryStorage) {
        // Valida a estrutura dos pedidos
        if (orderMemoryStorage && 
            Array.isArray(orderMemoryStorage.orders) && 
            typeof orderMemoryStorage.totalOrders === 'number' && 
            typeof orderMemoryStorage.currentPage === 'number') {
          return orderMemoryStorage;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
    return null;
  };

  // Função para limpar os pedidos da memória
  const clearStoredOrders = (): void => {
    try {
      orderMemoryStorage = null;
      console.log('Pedidos limpos da memória');
    } catch (error) {
      console.error('Erro ao limpar pedidos:', error);
    }
  };

  // Função para verificar se há pedidos salvos
  const hasStoredOrders = (): boolean => {
    try {
      return orderMemoryStorage !== null && orderMemoryStorage.orders.length > 0;
    } catch (error) {
      console.error('Erro ao verificar pedidos salvos:', error);
      return false;
    }
  };

  // Listener para mudanças nos pedidos (simulado)
  useEffect(() => {
    const handleOrderChange = () => {
      console.log('Pedidos atualizados');
    };

    // Simular listener de mudanças
    window.addEventListener('ordersUpdated', handleOrderChange);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrderChange);
    };
  }, []);

  return {
    saveOrders,
    loadOrders,
    clearStoredOrders,
    hasStoredOrders
  };
};