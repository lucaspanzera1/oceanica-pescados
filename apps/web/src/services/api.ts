import { API_ENDPOINTS } from '../utils/constants';
import { ProductsResponse, ProductResponse } from '../types/product';
import { CartResponse, AddToCartRequest, AddToCartResponse } from '../types/cart';
import { OrdersResponse, CreateOrderRequest, CreateOrderResponse, OrderItemsResponse, CancelOrderResponse, SimpleOrderData } from '../types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Verificar se localStorage está disponível
    let token = null;
    try {
      if (typeof localStorage !== 'undefined') {
        token = localStorage.getItem('token');
      }
    } catch (error) {
      console.warn('localStorage não disponível:', error);
    }
    
    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    //// console.log(`Fazendo requisição: ${this.baseUrl}${endpoint}`, { method: config.method || 'GET' });

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON, manter a mensagem de erro HTTP
      }
      console.error(`Erro na requisição ${endpoint}:`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    //// console.log(`Resposta da requisição ${endpoint}:`, data);
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    };
    
    return this.request<T>(endpoint, options);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    };
    
    return this.request<T>(endpoint, options);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // ============ MÉTODOS DE PRODUTOS ============
  async getProducts(page: number = 1, limit: number = 10): Promise<ProductsResponse> {
    return this.get<ProductsResponse>(`${API_ENDPOINTS.PRODUCTS}?page=${page}&limit=${limit}`);
  }

  async getProductById(id: string): Promise<ProductResponse> {
    return this.get<ProductResponse>(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  }

  // ============ MÉTODOS DO CARRINHO ============
  async getCart(): Promise<CartResponse> {
    return this.get<CartResponse>(API_ENDPOINTS.CART);
  }

  async addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
    return this.post<AddToCartResponse>(API_ENDPOINTS.CART, data);
  }

  async updateCartItem(productId: string, quantity: number): Promise<AddToCartResponse> {
    const endpoint = `${API_ENDPOINTS.CART}/${productId}`;
    //// console.log(`Atualizando produto no carrinho: ${productId} com quantidade: ${quantity}`);
    return this.put<AddToCartResponse>(endpoint, { quantity });
  }

  async removeCartItem(productId: string): Promise<AddToCartResponse> {
    const endpoint = `${API_ENDPOINTS.CART}/${productId}`;
    //// console.log(`Removendo produto do carrinho: ${productId}`);
    return this.delete<AddToCartResponse>(endpoint);
  }

  async clearCart(): Promise<AddToCartResponse> {
    return this.delete<AddToCartResponse>(API_ENDPOINTS.CART);
  }

  // ============ MÉTODOS DE ENDEREÇO ============
  async getAddress(id: string): Promise<AddressResponse> {
    return this.get<AddressResponse>(`/addresses/${id}`);
  }

  // ============ MÉTODOS DE PEDIDOS ============

  /**
   * Cria um novo pedido simplificado (sem login)
   * @param data Dados do pedido (nome, telefone e ID do produto)
   */
  async createSimpleOrder(data: SimpleOrderData): Promise<CreateOrderResponse> {
    return this.post<CreateOrderResponse>('/orders/simple', data);
  }
  
  /**
   * Busca todos os pedidos do usuário autenticado
   * @param page Página atual (padrão: 1)
   * @param limit Itens por página (padrão: 10)
   */
  async getOrders(page: number = 1, limit: number = 10): Promise<OrdersResponse> {
    const endpoint = `${API_ENDPOINTS.ORDERS}?page=${page}&limit=${limit}`;
    //(`Buscando pedidos - página ${page}, limite ${limit}`);
    return this.get<OrdersResponse>(endpoint);
  }

  /**
   * Cria um novo pedido com os itens do carrinho atual
   * @param data Dados do pedido (preço do frete)
   */
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    //// console.log('Criando novo pedido:', data);
    // Note: O endpoint para criar pedido é POST /orders, não /orders/my
    return this.post<CreateOrderResponse>('/orders', data);
  }

  /**
   * Busca um pedido específico por ID
   * @param id ID do pedido
   */
  async getOrderById(id: string): Promise<CreateOrderResponse> {
    const endpoint = `/orders/${id}`;
    // console.log(`Buscando pedido por ID: ${id}`);
    return this.get<CreateOrderResponse>(endpoint);
  }

  /**
   * Busca os itens de um pedido específico
   * @param id ID do pedido
   */
  async getOrderItems(id: string): Promise<OrderItemsResponse> {
    const endpoint = `/order-items/order/${id}`;
    // console.log(`Buscando itens do pedido: ${id}`);
    return this.get<OrderItemsResponse>(endpoint);
  }

  /**
   * Cancela um pedido específico
   * @param id ID do pedido
   */
  async cancelOrder(id: string): Promise<CancelOrderResponse> {
    const endpoint = `/orders/${id}/cancel`;
    // console.log(`Cancelando pedido: ${id}`);
    return this.patch<CancelOrderResponse>(endpoint);
  }

  /**
   * Atualiza o status de um pedido (apenas admin)
   * @param id ID do pedido
   * @param status Novo status ('confirmado', 'enviado', 'cancelado')
   */
  async updateOrderStatus(id: string, status: string): Promise<CancelOrderResponse> {
    const endpoint = `/orders/${id}/status`;
    return this.patch<CancelOrderResponse>(endpoint, { status });
  }

  // Método PATCH para cancelamento
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);