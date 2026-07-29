import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring' }}
        className="max-w-md w-full text-center"
      >
        <div className="text-9xl font-black heading-glow tracking-tight leading-none">404</div>
        <div className="mt-4 flex items-center justify-center gap-2 text-neon-yellow">
          <FaExclamationTriangle size={18} />
          <span className="font-semibold tracking-wider uppercase text-sm">Página no encontrada</span>
        </div>
        <p className="mt-4 text-dark-400 text-sm">
          La ruta a la que intentas acceder no existe en este sistema.
          Quizás fue movida, eliminada o nunca existió.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
            <FaHome size={14} /> Ir al Dashboard
          </Link>
          <button onClick={() => history.back()} className="btn-secondary inline-flex items-center gap-2">
            <FaArrowLeft size={14} /> Volver
          </button>
        </div>
      </motion.div>
    </div>
  );
}
