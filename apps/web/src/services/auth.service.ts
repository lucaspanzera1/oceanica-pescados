import { apiService } from './api';
import type { LoginRequest, LoginResponse, ProfileResponse, RegisterRequest, RegisterResponse } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return apiService.post<RegisterResponse>('/auth/register/', userData);
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

  setUserData(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUserData(): any {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};