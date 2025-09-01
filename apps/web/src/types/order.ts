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

// Estados do contexto de pedidos
export interface OrderState {
  orders: Order[];
  totalOrders: number;
  currentPage: number;
}