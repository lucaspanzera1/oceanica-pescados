export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'cliente' | 'admin' | 'ADMIN' | 'USER'; // Incluindo possíveis variações
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, phone: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean; // Nova propriedade adicionada
}


export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    message?: string;
  };
  message?: string;
}

