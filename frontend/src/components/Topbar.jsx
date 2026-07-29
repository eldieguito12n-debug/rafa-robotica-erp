import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBars, FaSearch, FaBell, FaRobot, FaPlus, FaCog, FaChevronDown,
} from 'react-icons/fa';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../lib/api';
import { formatDate, getStatusBadge, timeAgo } from '../lib/utils';

const labels = {
  '/dashboard': { label: 'Dashboard', desc: 'Visión general y estadísticas en tiempo real' },
  '/users': { label: 'Gestión de Usuarios', desc: 'Administra usuarios y permisos del sistema' },
  '/developers': { label: 'Desarrolladores', desc: 'Equipo de trabajo y rendimiento' },
  '/projects': { label: 'Proyectos', desc: 'Gestión y seguimiento de proyectos activos' },
  '/kanban': { label: 'Tablero Kanban', desc: 'Visualización ágil de tareas' },
  '/tasks': { label: 'Tareas', desc: 'Administración y asignación de tareas' },
  '/inventory': { label: 'Inventario', desc: 'Control de componentes y suministros' },
  '/labs': { label: 'Laboratorios', desc: 'Estado de los espacios de trabajo' },
  '/financial': { label: 'Finanzas', desc: 'Ingresos, egresos y utilidad' },
  '/clients': { label: 'Clientes', desc: 'Base de datos de clientes' },
  '/quotes': { label: 'Cotizaciones', desc: 'Cotizaciones y propuestas comerciales' },
  '/invoices': { label: 'Facturas', desc: 'Facturación y cobros' },
  '/calendar': { label: 'Calendario', desc: 'Cronograma de eventos y entregas' },
  '/chat': { label: 'Chat Interno', desc: 'Comunicación en tiempo real' },
  '/reports': { label: 'Reportes', desc: 'Informes y análisis de datos' },
};

function getCrumb(pathname) {
  const key = Object.keys(labels).find(k => pathname.startsWith(k) && (k === '/dashboard' || pathname.startsWith(k + '/') || k === pathname));
  return labels[key || '/dashboard'];
}

export default function Topbar() {
  const location = useLocation();
  const { setSidebarOpen, notifications, loadNotifications, unreadCount, setAiOpen, addToast } = useAppData();
  const { user, hasRole } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      loadNotifications();
      addToast('Todas las notificaciones leídas', 'success');
    } catch {}
  };

  const crumb = getCrumb(location.pathname);

  return (
    <header className="sticky top-0 z-30 glass border-b border-dark-600/50 px-4 md:px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(s => !s)}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-dark-700/60 transition text-dark-300 hover:text-white"
        >
          <FaBars />
        </button>

        <div className="hidden md:block min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <h1 className="font-bold text-lg truncate heading-glow">{crumb.label}</h1>
            <span className="text-dark-500">/</span>
            <span className="text-xs text-dark-500">HUD</span>
          </div>
          <div className="text-xs text-dark-400 truncate">{crumb.desc}</div>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-xs text-dark-400 w-96">
          <FaSearch size={12} />
          <span className="flex-1">Buscar proyectos, tareas, clientes...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-600/60 text-[10px] font-mono">⌘K</kbd>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/40 border border-dark-600/40 text-[11px] text-dark-400">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="font-mono">{time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-dark-600">|</span>
            <span className="font-mono">{time.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
          </div>

          <button
            onClick={() => setAiOpen(true)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-primary-600/20 hover:to-neon-green/20 transition text-dark-300 hover:text-neon-green group"
            title="Asistente IA"
          >
            <FaRobot size={18} className="group-hover:animate-bounce" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse border-2 border-dark-800" />
          </button>

          <div className="relative">
            <button
              onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-dark-700/60 transition text-dark-300 hover:text-white"
            >
              <FaBell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-80 glass rounded-2xl overflow-hidden z-50 shadow-glass hud-corner"
                >
                  <div className="p-4 border-b border-dark-600/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold">Notificaciones</div>
                      <div className="text-xs text-dark-400">{unreadCount} sin leer</div>
                    </div>
                    <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 font-semibold">
                      Marcar todas
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-dark-700/50">
                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-sm text-dark-500">
                        <FaBell className="mx-auto mb-3 text-3xl opacity-40" />
                        Sin notificaciones nuevas
                      </div>
                    )}
                    {notifications.slice(0, 10).map(n => (
                      <div key={n.id} className="p-3 hover:bg-dark-700/40 transition cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-dark-600' : 'bg-neon-blue shadow-[0_0_8px_rgba(0,212,255,0.8)]'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm">{n.title}</div>
                            <div className="text-xs text-dark-400 mt-0.5 line-clamp-2">{n.message}</div>
                            <div className="text-[10px] text-dark-500 mt-1">{timeAgo(n.created_at)}</div>
                          </div>
                          <span className={`text-[10px] shrink-0 ${getStatusBadge(n.type || '')}`}>
                            {n.type || 'info'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => addToast('Panel de configuración en construcción', 'info')}
            className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center hover:bg-dark-700/60 transition text-dark-300 hover:text-white"
          >
            <FaCog size={15} />
          </button>

          <button
            onClick={() => addToast('Acciones rápidas próximamente', 'info')}
            className="hidden md:flex items-center gap-2 btn-primary !px-3 !py-2 !text-sm"
          >
            <FaPlus size={12} />
            <span>Nuevo</span>
            <FaChevronDown size={10} />
          </button>
        </div>
      </div>
    </header>
  );
}
