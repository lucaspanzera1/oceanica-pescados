export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  image_url1?: string;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}