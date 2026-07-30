import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../lib/api';
import { delay } from '../lib/utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
        setIsAuthenticated(true);
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      const { access_token, user: u } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(u));
      setToken(access_token);
      setUser(u);
      setIsAuthenticated(true);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Error al iniciar sesión' };
    }
  };

  const register = async (data) => {
    try {
      const res = await authAPI.register(data);
      return { ok: true, user: res.data };
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Error al registrar' };
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const u = res.data;
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => {
    if (!user) return false;
    return ['administrador', 'administradora', 'jefe_desarrollo'].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout, refreshUser, hasRole, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
