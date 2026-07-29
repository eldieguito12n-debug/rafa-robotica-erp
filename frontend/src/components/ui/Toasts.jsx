import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { useAppData } from '../../context/AppDataContext';

const iconMap = {
  success: { Icon: FaCheckCircle, color: 'text-neon-green', bg: 'from-neon-green/20', border: 'border-neon-green/40', shadow: 'shadow-glow-green' },
  warning: { Icon: FaExclamationTriangle, color: 'text-neon-yellow', bg: 'from-neon-yellow/20', border: 'border-neon-yellow/40' },
  error: { Icon: FaExclamationCircle, color: 'text-red-400', bg: 'from-red-500/20', border: 'border-red-500/40' },
  info: { Icon: FaInfoCircle, color: 'text-neon-blue', bg: 'from-neon-blue/20', border: 'border-neon-blue/40', shadow: 'shadow-glow-cyan' },
};

function Toast({ toast, onClose }) {
  const cfg = iconMap[toast.type] || iconMap.info;
  const { Icon } = cfg;
  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={`pointer-events-auto w-full max-w-sm glass rounded-xl border ${cfg.border} ${cfg.bg} bg-gradient-to-r to-transparent ${cfg.shadow || ''} overflow-hidden`}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={22} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0 text-sm text-dark-100 break-words">
          {toast.message}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-dark-400 hover:text-white p-0.5 rounded transition"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Toasts({ toasts }) {
  const { removeToast } = useAppData();
  return (
    <div className="pointer-events-none fixed top-20 right-4 md:right-6 z-[100] flex flex-col gap-3 w-full max-w-sm">
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
