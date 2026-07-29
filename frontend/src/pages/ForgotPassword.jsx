import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaKey, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { authAPI } from '../lib/api';
import { useAppData } from '../context/AppDataContext';

export default function ForgotPassword() {
  const { addToast } = useAppData();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      addToast('Enlace enviado (token demo en consola)', 'success');
      setToken(res.data.token || 'demo-token');
      setStep(2);
    } catch { addToast('Error al enviar', 'error'); }
    setLoading(false);
  };

  const reset = async (e) => {
    e.preventDefault();
    if (!newPass) return;
    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPass);
      addToast('Contraseña actualizada correctamente', 'success');
      setStep(3);
    } catch { addToast('Error. Usa el token correcto', 'error'); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <div className="glass rounded-3xl p-8 shadow-glass hud-corner">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-dark-400 hover:text-white mb-4">
          <FaArrowLeft size={13} /> Volver al login
        </Link>
        {step === 1 && (
          <>
            <h2 className="text-2xl font-black heading-glow mb-1">Recuperar acceso</h2>
            <p className="text-sm text-dark-400 mb-6">Ingresa tu correo y te enviaremos el enlace</p>
            <form onSubmit={send} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Correo Electrónico</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field pl-10" placeholder="tu@correo.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Enviar Enlace</>}
              </button>
            </form>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-black heading-glow mb-1">Nueva Contraseña</h2>
            <p className="text-sm text-dark-400 mb-6">Ingresa la nueva contraseña para tu cuenta</p>
            <form onSubmit={reset} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Token (copia del link)</label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                  <input value={token} onChange={e => setToken(e.target.value)} required className="input-field pl-10 font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Nueva contraseña</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required className="input-field" placeholder="••••••" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Actualizar Contraseña'}
              </button>
            </form>
          </>
        )}
        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center mb-4 shadow-glow-green">
              <FaCheck size={36} className="text-neon-green" />
            </div>
            <h2 className="text-2xl font-black heading-glow mb-1">¡Listo!</h2>
            <p className="text-sm text-dark-400 mb-6">Tu contraseña fue actualizada correctamente</p>
            <Link to="/login" className="btn-primary inline-flex">Ir a Iniciar Sesión</Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
