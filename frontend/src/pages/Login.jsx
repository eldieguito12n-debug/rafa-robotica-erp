import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaRobot, FaUserPlus, FaKey } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export default function Login() {
  const { login, isLoading } = useAuth();
  const { addToast } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('admin@robolab.com');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return addToast('Por favor completa todos los campos', 'warning');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      addToast('¡Bienvenido de vuelta! 🤖', 'success');
      navigate(from, { replace: true });
    } else {
      addToast(res.error || 'Credenciales inválidas', 'error');
    }
  };

  const quickLogin = async (email, password) => {
    setEmail(email); setPassword(password);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) { addToast('Sesión iniciada correctamente', 'success'); navigate(from, { replace: true }); }
    else addToast(res.error, 'error');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass rounded-3xl p-7 md:p-8 shadow-glass hud-corner scan-line relative">
        <div className="mb-6">
          <h2 className="text-3xl font-black heading-glow">Iniciar Sesión</h2>
          <p className="text-sm text-dark-400 mt-1">Accede a tu plataforma RoboLab ERP</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-dark-400">Correo Electrónico</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com" required
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-dark-400">Contraseña</label>
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 font-medium">¿Olvidaste?</Link>
            </div>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="input-field pl-10 pr-10"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white">
                {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-dark-400 cursor-pointer select-none">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-primary-500" />
            Recordar sesión en este dispositivo
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-base flex items-center justify-center gap-2 group">
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FaRobot size={17} className="group-hover:animate-bounce" />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-dark-600/50 space-y-3">
          <div className="text-[11px] uppercase font-bold text-dark-500 tracking-wider text-center">Acceso rápido demo</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => quickLogin('admin@robolab.com', 'admin123')} className="text-xs px-3 py-2 rounded-lg bg-primary-600/15 hover:bg-primary-600/25 border border-primary-500/30 text-primary-300 font-semibold transition">
              🔐 Admin
            </button>
            <button onClick={() => quickLogin('jefe@robolab.com', 'jefe123')} className="text-xs px-3 py-2 rounded-lg bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green font-semibold transition">
              🧑‍💼 Jefe Dev
            </button>
            <button onClick={() => quickLogin('dev@robolab.com', 'dev123')} className="text-xs px-3 py-2 rounded-lg bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-semibold transition">
              👨‍💻 Programador
            </button>
            <button onClick={() => quickLogin('cliente@robolab.com', 'cli123')} className="text-xs px-3 py-2 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 text-neon-purple font-semibold transition">
              👥 Cliente
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-dark-500">
          ¿Olvidaste tu contraseña?{' '}
          <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 font-semibold inline-flex items-center gap-1">
            <FaKey size={11} /> Recuperar acceso
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
