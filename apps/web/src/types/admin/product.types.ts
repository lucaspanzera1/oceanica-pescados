export interface CreateProductRequest {
  name: string;
  description: string;
  price: string;
  stock: number;
  image?: File;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: string;
  stock?: number;
  image?: File;
}
