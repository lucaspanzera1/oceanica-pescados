export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;