export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  PRODUCTS: '/products',
  CART: '/cart',
  ORDERS: '/orders/my', // Endpoint para pedidos do usuário
  ADMIN_ORDERS: '/orders', // Endpoint para admin ver todos os pedidos
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  ORDERS: '/orders/my', // Nova rota para pedidos
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ORDERS: 'orders', // Nova chave para pedidos
} as const;