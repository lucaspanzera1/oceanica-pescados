import { API_ENDPOINTS } from '../utils/constants';
import { ProductsResponse, ProductResponse } from '../types/product';
import { CartResponse, AddToCartRequest, AddToCartResponse } from '../types/cart';

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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log(`Fazendo requisição: ${this.baseUrl}${endpoint}`, { method: config.method || 'GET' });

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
    console.log(`Resposta da requisição ${endpoint}:`, data);
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Método específico para buscar produtos
  async getProducts(page: number = 1, limit: number = 10): Promise<ProductsResponse> {
    return this.get<ProductsResponse>(`${API_ENDPOINTS.PRODUCTS}?page=${page}&limit=${limit}`);
  }

  // Método específico para buscar produto por ID
  async getProductById(id: string): Promise<ProductResponse> {
    return this.get<ProductResponse>(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  }

  // Métodos do carrinho
  async getCart(): Promise<CartResponse> {
    return this.get<CartResponse>(API_ENDPOINTS.CART);
  }

  async addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
    return this.post<AddToCartResponse>(API_ENDPOINTS.CART, data);
  }

  // Atualizar quantidade de um item específico no carrinho
  async updateCartItem(productId: string, quantity: number): Promise<AddToCartResponse> {
    const endpoint = `${API_ENDPOINTS.CART}/${productId}`;
    console.log(`Atualizando produto no carrinho: ${productId} com quantidade: ${quantity}`);
    return this.put<AddToCartResponse>(endpoint, { quantity });
  }

  // Remover um item específico do carrinho
  async removeCartItem(productId: string): Promise<AddToCartResponse> {
    const endpoint = `${API_ENDPOINTS.CART}/${productId}`;
    console.log(`Removendo produto do carrinho: ${productId}`);
    return this.delete<AddToCartResponse>(endpoint);
  }

  // Limpar todo o carrinho
  async clearCart(): Promise<AddToCartResponse> {
    return this.delete<AddToCartResponse>(API_ENDPOINTS.CART);
  }
}

export const apiService = new ApiService(API_BASE_URL);