import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import {
  FaRobot, FaTachometerAlt, FaUsers, FaUserTie, FaProjectDiagram,
  FaTasks, FaClipboardList, FaBoxes, FaCalculator, FaUserFriends,
  FaFileInvoiceDollar, FaQuoteLeft, FaCalendarAlt, FaComments,
  FaChartBar, FaFlask, FaChevronLeft, FaChevronRight, FaPowerOff, FaSun, FaMoon, FaBug
} from 'react-icons/fa';
import { getInitials, getAvatarGradient } from '../lib/utils';
import { useState } from 'react';

const menu = [
  { group: 'Principal', items: [
    { to: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt, roles: null, badge: 'Live' },
  ]},
  { group: 'Gestión', items: [
    { to: '/users', label: 'Usuarios', icon: FaUsers, adminOnly: true },
    { to: '/developers', label: 'Desarrolladores', icon: FaUserTie, adminOnly: true },
    { to: '/projects', label: 'Proyectos', icon: FaProjectDiagram, roles: null },
    { to: '/tasks', label: 'Tareas', icon: FaTasks, roles: null },
    { to: '/labs', label: 'Laboratorios', icon: FaFlask, adminOnly: true },
  ]},
  { group: 'Operaciones', items: [
    { to: '/inventory', label: 'Inventario', icon: FaBoxes, roles: null },
    { to: '/calendar', label: 'Calendario', icon: FaCalendarAlt, roles: null },
    { to: '/chat', label: 'Chat Global', icon: FaComments, roles: null },
  ]},
  { group: 'Negocios', items: [
    { to: '/quotes', label: 'Cotizaciones', icon: FaQuoteLeft, adminOnly: true },
    { to: '/financial', label: 'Finanzas', icon: FaCalculator, adminOnly: true },
  ]},
  { group: 'Analítica', items: [
    { to: '/reports', label: 'Reportes', icon: FaChartBar, adminOnly: true },
  ]},
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppData();
  const { user, logout, hasRole, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-dark-950/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? (window.innerWidth < 1024 ? '100%' : 270) : 0,
          opacity: sidebarOpen ? 1 : 0,
          x: sidebarOpen ? 0 : -20,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`fixed lg:static inset-y-0 left-0 z-50 overflow-hidden ${sidebarOpen ? 'lg:w-[270px]' : 'w-0'}`}
      >
        <div className="h-full glass border-r border-dark-600/60 flex flex-col w-[270px] max-w-full">
          <div className="p-5 flex items-center gap-3 border-b border-dark-600/50">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 via-primary-500 to-neon-green flex items-center justify-center shadow-glow-blue flex-shrink-0 animate-glow">
              <FaRobot size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg leading-tight heading-glow truncate">RAFA ROBOTICA</div>
              <div className="text-[11px] text-dark-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                Smart Platform · v1.0
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5 pr-1">
            {menu.map((group) => {
              const visible = group.items.filter(i => {
                if (i.adminOnly && !isAdmin()) return false;
                if (i.roles) return hasRole(...i.roles);
                return true;
              });
              if (!visible.length) return null;
              return (
                <div key={group.group}>
                  <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-dark-500">
                    {group.group}
                  </div>
                  <nav className="space-y-0.5">
                    {visible.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'text-white bg-gradient-to-r from-primary-600/30 to-neon-green/10 shadow-glow-blue'
                              : 'text-dark-300 hover:text-white hover:bg-dark-700/60'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gradient-to-b from-primary-400 to-neon-green"
                            />
                          )}
                          <Icon size={17} className={`flex-shrink-0 ${active ? 'text-neon-blue' : ''}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neon-green/15 text-neon-green font-bold border border-neon-green/30">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>

          <div className="p-3 space-y-2 border-t border-dark-600/50">
            <div className="card !p-3 flex items-center gap-3 hud-corner">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(user?.id)} flex items-center justify-center font-bold text-white flex-shrink-0`}>
                {getInitials(user?.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{user?.full_name}</div>
                <div className="text-[11px] text-dark-400 truncate capitalize">{String(user?.role || '').replace(/_/g, ' ')}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/60 transition"
                title="Cambiar tema"
              >
                {isDark ? <FaSun size={15} /> : <FaMoon size={15} />}
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center justify-center py-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Cerrar sesión"
              >
                <FaPowerOff size={15} />
              </button>
              <button
                onClick={() => setSidebarOpen(s => !s)}
                className="lg:flex hidden items-center justify-center py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/60 transition"
                title="Contraer"
              >
                {sidebarOpen ? <FaChevronLeft size={15} /> : <FaChevronRight size={15} />}
              </button>
            </div>
            {confirming && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-xl p-3 text-xs space-y-2"
                >
                  <div className="font-semibold text-white">¿Cerrar sesión?</div>
                  <div className="flex gap-2">
                    <button onClick={() => { logout(); setConfirming(false); }} className="btn-danger !px-3 !py-1.5 !text-xs flex-1">
                      Si, salir
                    </button>
                    <button onClick={() => setConfirming(false)} className="btn-secondary !px-3 !py-1.5 !text-xs flex-1">
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
