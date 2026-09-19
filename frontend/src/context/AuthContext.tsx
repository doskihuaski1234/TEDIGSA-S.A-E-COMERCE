import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tedigsa_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tedigsa_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('tedigsa_token', data.token);
    localStorage.setItem('tedigsa_user', JSON.stringify(data.usuario));
    setToken(data.token);
    setUser(data.usuario);
  };

  const register = async (formData: any) => {
    const { data } = await authApi.register(formData);
    localStorage.setItem('tedigsa_token', data.token);
    localStorage.setItem('tedigsa_user', JSON.stringify(data.usuario));
    setToken(data.token);
    setUser(data.usuario);
  };

  const logout = () => {
    localStorage.removeItem('tedigsa_token');
    localStorage.removeItem('tedigsa_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.rol === 'Administrador' || user?.rol === 'Encargado de Ventas/Bodega';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
