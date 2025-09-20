import { apiService } from '../api';
import { ProductResponse, CreateProductRequest, UpdateProductRequest } from '../../types/products';
import { API_ENDPOINTS } from '../../utils/constants';

export const adminProductService = {
  // Create a new product
  async createProduct(data: FormData): Promise<ProductResponse> {
    return apiService.post<ProductResponse>(API_ENDPOINTS.PRODUCTS, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update an existing product
  async updateProduct(id: string, data: FormData): Promise<ProductResponse> {
    return apiService.put<ProductResponse>(`${API_ENDPOINTS.PRODUCTS}/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete a product
  async deleteProduct(id: string): Promise<void> {
    return apiService.delete<void>(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  },
};