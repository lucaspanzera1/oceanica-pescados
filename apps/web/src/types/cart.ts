export interface CartProduct {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: CartProduct;
  subtotal: number;
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  summary: CartSummary;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: {
    cart: Cart;
  };
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface AddToCartResponse {
  success: boolean;
  message: string;
  data?: any;
}