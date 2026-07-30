import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useAppData } from './context/AppDataContext';
import AuthLayout from './layouts/AuthLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Developers from './pages/Developers.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Kanban from './pages/Kanban.jsx';
import Tasks from './pages/Tasks.jsx';
import Inventory from './pages/Inventory.jsx';
import Financial from './pages/Financial.jsx';
import Clients from './pages/Clients.jsx';
import Quotes from './pages/Quotes.jsx';
import Invoices from './pages/Invoices.jsx';
import Calendar from './pages/Calendar.jsx';
import Chat from './pages/Chat.jsx';
import Reports from './pages/Reports.jsx';
import Labs from './pages/Labs.jsx';
import AccessDenied from './pages/AccessDenied.jsx';
import NotFound from './pages/NotFound.jsx';
import Toasts from './components/ui/Toasts.jsx';
import AIAssistant from './components/AIAssistant.jsx';

/**
 * RequireAuth — Protege rutas según autenticación y rol.
 * Si adminOnly=true y el usuario no es admin, redirige a /access-denied (403).
 */
function RequireAuth({ children, roles, adminOnly }) {
  const { isAuthenticated, user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 grid-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/access-denied" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;

  return children;
}

export default function App() {
  const { toasts } = useAppData();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 relative overflow-x-hidden">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-40" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />
      <Toasts toasts={toasts} />
      <AIAssistant />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Página de acceso denegado (sin layout de app) */}
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* App — requiere autenticación */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Gestión de Usuarios — solo Admin */}
            <Route path="/users"      element={<RequireAuth adminOnly><Users /></RequireAuth>} />
            <Route path="/developers" element={<RequireAuth adminOnly><Developers /></RequireAuth>} />

            {/* Proyectos — todos ven, filtrado por rol en backend */}
            <Route path="/projects"     element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/kanban"       element={<Kanban />} />

            {/* Tareas — todos ven sus tareas, filtrado por rol en backend */}
            <Route path="/tasks" element={<Tasks />} />

            {/* Inventario — todos pueden ver y retirar; crear/editar/eliminar restringido en UI+backend */}
            <Route path="/inventory" element={<Inventory />} />

            {/* Laboratorios — todos pueden ver; crear/editar/eliminar restringido en UI+backend */}
            <Route path="/labs" element={<Labs />} />

            {/* Módulos de Negocio — solo Admin */}
            <Route path="/financial" element={<RequireAuth adminOnly><Financial /></RequireAuth>} />
            <Route path="/clients"   element={<RequireAuth adminOnly><Clients /></RequireAuth>} />
            <Route path="/quotes"    element={<RequireAuth adminOnly><Quotes /></RequireAuth>} />
            <Route path="/invoices"  element={<RequireAuth adminOnly><Invoices /></RequireAuth>} />
            <Route path="/reports"   element={<RequireAuth adminOnly><Reports /></RequireAuth>} />

            {/* Herramientas compartidas */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/chat"     element={<Chat />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
