import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import type { User, AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;
  
  // Nova funcionalidade: verificar se o usuário é admin
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = authService.getToken();
      const savedUser = authService.getUserData();
      
      if (savedToken && savedUser) {
        try {
          // Set initial state from localStorage
          setUser(savedUser);
          setToken(savedToken);
          
          // Validate token and update user data in background
          const response = await authService.getProfile();
          if (response.success) {
            setUser(response.data.user);
            authService.setUserData(response.data.user);
          } else {
            authService.removeToken();
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Erro ao validar token:', error);
          authService.removeToken();
          setUser(null);
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        authService.setToken(response.data.token);
        authService.setUserData(response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.register({
        email,
        password,
        name,
        phone,
        role: 'cliente'
      });
      
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        authService.setToken(response.data.token);
        authService.setUserData(response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authService.removeToken();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    isAdmin, // Nova propriedade adicionada
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};