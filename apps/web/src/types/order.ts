export interface Order {
  id: string;
  user_id: string;
  status: 'pendente' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  shipping_price: string;
  total_price: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  items_count: string;
}

export interface OrdersPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: OrdersPagination;
  };
}

export interface CreateOrderRequest {
  shipping_price: number;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data?: {
    order: Order;
  };
}

// Item do pedido
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: string;
  subtotal: string;
  created_at: string;
  product_name: string;
  product_description: string;
  product_image_url: string;
}

// Resposta dos itens do pedido
export interface OrderItemsResponse {
  success: boolean;
  message: string;
  data: {
    items: OrderItem[];
  };
}

// Resposta do cancelamento
export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Estados do contexto de pedidos
export interface OrderState {
  orders: Order[];
  totalOrders: number;
  currentPage: number;
}