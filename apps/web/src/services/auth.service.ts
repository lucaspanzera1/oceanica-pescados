import { apiService } from './api';
import type { LoginRequest, LoginResponse, ProfileResponse } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  },

  async getProfile(): Promise<ProfileResponse> {
    return apiService.get<ProfileResponse>('/auth/profile');
  },

  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  removeToken(): void {
    localStorage.removeItem('token');
  },
};