import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { motion } from 'framer-motion';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-[1800px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
        <footer className="px-6 py-4 text-xs text-dark-500 border-t border-dark-700/50 flex flex-wrap justify-between gap-2 relative z-10">
          <div>© 2025 RAFA ROBOTICA · Todos los derechos reservados</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              Sistema en línea
            </span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
