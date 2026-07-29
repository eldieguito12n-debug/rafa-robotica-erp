import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaPlus, FaEdit, FaTrash, FaUserShield, FaFilter, FaDownload,
  FaTimes, FaUserTag, FaEnvelope, FaPhone, FaLock, FaRobot,
} from 'react-icons/fa';
import { authAPI, usersAPI } from '../lib/api';
import { useAppData } from '../context/AppDataContext';
import { cn, formatDate, getStatusBadge } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';

const rolesList = ['administrador','jefe_desarrollo','ingeniero_electronico','programador','disenador_cad','tecnico','contador','cliente'];
const rolesSpanish = {
  administrador: 'Administrador',
  jefe_desarrollo: 'Jefe de Desarrollo',
  ingeniero_electronico: 'Ingeniero Electrónico',
  programador: 'Programador',
  disenador_cad: 'Diseñador CAD',
  tecnico: 'Técnico',
  contador: 'Contador',
  cliente: 'Cliente',
};
const roleColors = {
  administrador: 'bg-neon-purple/15 text-neon-purple border-neon-purple/30',
  jefe_desarrollo: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  ingeniero_electronico: 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30',
  programador: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
  disenador_cad: 'bg-neon-green/15 text-neon-green border-neon-green/30',
  tecnico: 'bg-neon-orange/15 text-neon-yellow border-neon-yellow/40',
  contador: 'bg-primary-400/15 text-primary-400 border-primary-400/30',
  cliente: 'bg-dark-600/50 text-dark-300 border-dark-500/40',
};

function genPass() {
  return 'RoboLab-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Users() {
  const { addToast } = useAppData();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', role: 'programador', password: genPass(),
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list({ search: search || undefined, role: role || undefined });
      setUsers(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, role]);

  const toggleActive = async (u) => {
    try {
      await usersAPI.update(u.id, { is_active: !u.is_active });
      addToast(`Usuario ${u.is_active ? 'desactivado' : 'activado'}`, 'success');
      load();
    } catch { addToast('Error actualizando', 'error'); }
  };

  const openModal = () => {
    setForm({ full_name: '', email: '', phone: '', role: 'programador', password: genPass() });
    setModalOpen(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return addToast('Completa Nombre, Email y Contraseña', 'warning');
    setSubmitting(true);
    try {
      await authAPI.register(form);
      addToast('✅ Trabajador creado correctamente', 'success');
      setModalOpen(false);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      addToast(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Error creando usuario') , 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card !p-5 flex flex-col md:flex-row md:items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
            <FaUserShield size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Gestión de Usuarios</h2>
            <p className="text-xs text-dark-400">{users.length} usuarios registrados · Solo Admin / Jefe crean trabajadores</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="input-field !py-2 !pl-8 !pr-3 text-sm w-48"
            />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)} className="input-field !py-2 !text-sm w-44">
            <option value="">Todos los roles</option>
            {rolesList.map(r => <option key={r} value={r}>{rolesSpanish[r]}</option>)}
          </select>
          <button className="btn-secondary !px-3 !py-2 !text-sm" onClick={() => addToast('Filtros avanzados próximamente', 'info')}>
            <FaFilter size={12} />
          </button>
          <button className="btn-secondary !px-3 !py-2 !text-sm" onClick={() => addToast('Exportando usuarios Excel...', 'success')}>
            <FaDownload size={12} />
          </button>
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openModal}>
            <FaPlus size={12} /> Nuevo Trabajador
          </button>
        </div>
      </motion.div>

      <div className="card hud-corner !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/70 border-b border-dark-600/60 text-xs uppercase tracking-wider text-dark-400">
              <tr>
                <th className="text-left py-3 px-4">Usuario</th>
                <th className="text-left py-3 px-4">Rol</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Contacto</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Creado</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-10 text-center text-dark-500">
                  <span className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin inline-block" />
                </td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-dark-500">Sin usuarios que coincidan</td></tr>
              )}
              {users.map(u => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="border-b border-dark-700/40 hover:bg-primary-500/5 transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name} id={u.id} size="sm" online={u.is_active} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{u.full_name}</div>
                        <div className="text-xs text-dark-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2.5 py-1 rounded-lg capitalize font-semibold border', roleColors[u.role] || roleColors.programador)}>
                      {rolesSpanish[u.role] || String(u.role).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-dark-300 hidden lg:table-cell">
                    {u.phone || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(u)} className={getStatusBadge(u.is_active ? 'activo' : 'inactivo')}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-xs text-dark-400 hidden md:table-cell">{formatDate(u.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="w-8 h-8 rounded-lg hover:bg-primary-500/15 text-primary-400 hover:text-primary-300 flex items-center justify-center transition" title="Editar" onClick={() => addToast('Editar usuario (próximamente)', 'info')}>
                        <FaEdit size={13} />
                      </button>
                      <button className="w-8 h-8 rounded-lg hover:bg-red-500/15 text-red-400 hover:text-red-300 flex items-center justify-center transition" title="Desactivar" onClick={() => toggleActive(u)}>
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !submitting && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-md glass hud-corner scan-line rounded-3xl p-6 md:p-7 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 border-4 border-dark-900 flex items-center justify-center shadow-glow-blue">
                <FaRobot size={40} className="text-white" />
              </div>
              <button onClick={() => !submitting && setModalOpen(false)} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-dark-700/60 hover:bg-red-500/15 text-dark-400 hover:text-red-400 flex items-center justify-center transition">
                <FaTimes size={14} />
              </button>
              <div className="pt-10 mb-5 text-center">
                <h3 className="text-2xl font-black heading-glow">Nuevo Trabajador</h3>
                <p className="text-xs text-dark-400 mt-1">Registra un nuevo miembro del equipo RoboLab</p>
              </div>

              <form onSubmit={submitCreate} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 flex items-center gap-1.5">
                    <FaUserTag size={10}/> Nombre Completo
                  </label>
                  <input
                    type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Juan Pérez Gómez" className="input-field !py-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 flex items-center gap-1.5">
                    <FaEnvelope size={10}/> Correo Electrónico
                  </label>
                  <input
                    type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="juan@robolab.com" className="input-field !py-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 flex items-center gap-1.5">
                    <FaPhone size={10}/> Teléfono <span className="text-dark-600 normal-case">(opcional)</span>
                  </label>
                  <input
                    type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+57 300 123 4567" className="input-field !py-2.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 flex items-center gap-1.5">
                      <FaUserShield size={10}/> Rol
                    </label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field !py-2.5">
                      {rolesList.map(r => <option key={r} value={r}>{rolesSpanish[r]}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><FaLock size={10}/> Contraseña</span>
                      <button type="button" onClick={() => setForm({ ...form, password: genPass() })} className="text-[10px] text-primary-400 hover:text-primary-300 normal-case font-bold px-2 py-0.5 rounded bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20">
                        Generar
                      </button>
                    </label>
                    <input
                      type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input-field !py-2.5 font-mono text-xs !tracking-widest" minLength={6}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-2.5">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="btn-secondary flex-1 !py-2.5">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-[1.2] !py-2.5 flex items-center justify-center gap-2">
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaPlus size={12} />
                        Crear Trabajador
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
