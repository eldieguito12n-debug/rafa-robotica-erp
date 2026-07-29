import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

const roles = [
  { v: 'programador', l: 'Programador' },
  { v: 'ingeniero_electronico', l: 'Ingeniero Electrónico' },
  { v: 'disenador_cad', l: 'Diseñador CAD' },
  { v: 'tecnico', l: 'Técnico' },
  { v: 'cliente', l: 'Cliente' },
];

export default function Register() {
  const { register } = useAuth();
  const { addToast } = useAppData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', full_name: '', password: '', confirm: '', phone: '', role: 'programador' });
  const [loading, setLoading] = useState(false);

  const change = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return addToast('Las contraseñas no coinciden', 'error');
    if (form.password.length < 6) return addToast('La contraseña debe tener al menos 6 caracteres', 'warning');
    setLoading(true);
    const res = await register({ email: form.email, full_name: form.full_name, password: form.password, phone: form.phone, role: form.role });
    setLoading(false);
    if (res.ok) {
      addToast('Cuenta creada. Ahora inicia sesión', 'success');
      navigate('/login');
    } else {
      addToast(res.error, 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto">
      <div className="glass rounded-3xl p-7 shadow-glass hud-corner relative overflow-hidden">
        <h2 className="text-3xl font-black heading-glow mb-1">Crear Cuenta</h2>
        <p className="text-sm text-dark-400 mb-6">Únete a la plataforma RoboLab ERP</p>

        <form onSubmit={submit} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Nombre Completo</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                <input value={form.full_name} onChange={change('full_name')} required className="input-field pl-10" placeholder="Tu Nombre" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                <input type="email" value={form.email} onChange={change('email')} required className="input-field pl-10" placeholder="tu@correo.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Teléfono</label>
              <div className="relative">
                <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                <input value={form.phone} onChange={change('phone')} className="input-field pl-10" placeholder="+57 300 000 0000" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Rol</label>
              <select value={form.role} onChange={change('role')} className="input-field">
                {roles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Contraseña</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                <input type="password" value={form.password} onChange={change('password')} required className="input-field pl-10" placeholder="••••••" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-dark-400 mb-1 block">Confirmar</label>
              <div className="relative">
                <FaCheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={15} />
                <input type="password" value={form.confirm} onChange={change('confirm')} required className="input-field pl-10" placeholder="••••••" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-base flex items-center justify-center gap-2">
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FaUserPlus size={16} /> Crear Mi Cuenta
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-dark-400">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Inicia sesión</Link>
        </div>
      </div>
    </motion.div>
  );
}
