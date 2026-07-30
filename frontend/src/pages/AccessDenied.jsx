import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark-950 grid-bg flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="glass hud-corner rounded-3xl p-10 max-w-lg w-full text-center relative"
      >
        {/* Icono */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 350, damping: 22 }}
          className="mx-auto mb-6 w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center"
        >
          <FaLock size={38} className="text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
        </motion.div>

        {/* Badge 403 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-4">
          <FaExclamationTriangle size={10} />
          ERROR 403 — ACCESO DENEGADO
        </div>

        <h1 className="text-4xl font-black text-white mb-2">
          Sin <span className="text-red-400">Permiso</span>
        </h1>
        <p className="text-dark-300 text-sm leading-relaxed mb-2">
          No tienes autorización para acceder a este recurso.
        </p>
        {user && (
          <p className="text-dark-500 text-xs mb-8">
            Rol actual:{' '}
            <span className="text-dark-300 font-semibold capitalize">
              {String(user.role || '').replace(/_/g, ' ')}
            </span>
          </p>
        )}

        {/* Línea decorativa */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent my-6" />

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-700/60 hover:bg-dark-700 border border-dark-600/60 text-dark-200 hover:text-white text-sm font-medium transition-all"
          >
            <FaArrowLeft size={13} /> Regresar
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/40 text-primary-300 hover:text-primary-200 text-sm font-medium transition-all"
          >
            Ir al Dashboard
          </button>
        </div>

        {/* Decoración de esquinas */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-red-500/20 rounded-tr-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-red-500/20 rounded-bl-3xl pointer-events-none" />
      </motion.div>
    </div>
  );
}
