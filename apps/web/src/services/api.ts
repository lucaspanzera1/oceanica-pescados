import { API_ENDPOINTS } from '../utils/constants';
import { ProductsResponse, ProductResponse } from '../types/product';

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
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro na requisição');
    }

    return response.json();
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
}

export const apiService = new ApiService(API_BASE_URL);