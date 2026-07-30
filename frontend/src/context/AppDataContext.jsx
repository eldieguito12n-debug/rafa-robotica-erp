import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationsAPI } from '../lib/api';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    if (message && typeof message === 'string' && (message.toLowerCase().includes('error cargando') || message.toLowerCase().includes('error al cargar'))) {
      return null;
    }
    let formattedMessage = message;
    if (typeof message !== 'string') {
      try {
        formattedMessage = Array.isArray(message) ? message.map(m => m.msg || JSON.stringify(m)).join(', ') : JSON.stringify(message);
      } catch (e) {
        formattedMessage = 'Error desconocido';
      }
    }
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message: formattedMessage, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.list(false, 30);
      setNotifications(res.data || []);
    } catch {}
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppDataContext.Provider value={{
      toasts, addToast, removeToast,
      sidebarOpen, setSidebarOpen,
      notifications, setNotifications, loadNotifications, unreadCount,
      aiOpen, setAiOpen,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
