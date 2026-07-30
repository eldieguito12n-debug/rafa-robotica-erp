import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

// Roles con acceso completo de administración
const ADMIN_ROLES = new Set(['administrador', 'administradora', 'jefe_desarrollo']);

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

  // ─── Helpers de Rol ────────────────────────────────────────────────────────

  const hasRole = (...roles) => {
    if (!user) return false;
    const lowerRole = (user.role || '').toLowerCase();
    return roles.map(r => r.toLowerCase()).includes(lowerRole);
  };

  const isAdmin = () => {
    if (!user) return false;
    const lowerRole = (user.role || '').toLowerCase();
    return ADMIN_ROLES.has(lowerRole);
  };

  // ─── Permisos Granulares ───────────────────────────────────────────────────

  /** Puede ver y gestionar usuarios (crear, editar, desactivar, asignar roles) */
  const canManageUsers = () => isAdmin();

  /** Puede crear, editar y eliminar proyectos */
  const canManageProjects = () => isAdmin();

  /** Puede crear, editar y eliminar tareas (de cualquier usuario) */
  const canManageTasks = () => isAdmin();

  /** Puede crear, editar y eliminar laboratorios */
  const canManageLabs = () => isAdmin();

  /** Puede agregar productos, hacer entradas, editar y eliminar del inventario */
  const canManageInventory = () => isAdmin();

  /** Puede retirar materiales del inventario (todos los usuarios autenticados) */
  const canWithdrawInventory = () => !!user;

  /** Puede actualizar el estado de una tarea (asignada a sí mismo, o admin) */
  const canUpdateTask = (task) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return task?.assigned_to_id === user.id;
  };

  /** Puede agregar comentarios/evidencias a una tarea (asignada a sí mismo, o admin) */
  const canCommentTask = (task) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return task?.assigned_to_id === user.id;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
        isAdmin,
        canManageUsers,
        canManageProjects,
        canManageTasks,
        canManageLabs,
        canManageInventory,
        canWithdrawInventory,
        canUpdateTask,
        canCommentTask,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
