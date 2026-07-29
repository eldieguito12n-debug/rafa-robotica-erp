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
import NotFound from './pages/NotFound.jsx';
import Toasts from './components/ui/Toasts.jsx';
import AIAssistant from './components/AIAssistant.jsx';

function RequireAuth({ children, roles }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 grid-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
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
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<RequireAuth roles={['administrador','jefe_desarrollo']}><Users /></RequireAuth>} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/financial" element={<RequireAuth roles={['administrador','contador','jefe_desarrollo']}><Financial /></RequireAuth>} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
