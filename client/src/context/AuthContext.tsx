import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from './ToastContext.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar?: string; bio?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token_ref'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { error } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.getCurrentUser();
        setUser(res.user);
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token_ref');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setUser(res.user);
    setToken(res.token);
  };

  const register = async (data: { username: string; email: string; password: string; confirmPassword: string }) => {
    const res = await api.register(data);
    setUser(res.user);
    setToken(res.token);
  };

  const updateProfile = async (data: { username?: string; avatar?: string; bio?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    if (res.token) setToken(res.token);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignora erro de logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token_ref');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
