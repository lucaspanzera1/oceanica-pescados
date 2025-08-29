export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  PRODUCTS: '/products',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;