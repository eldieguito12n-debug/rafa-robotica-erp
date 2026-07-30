import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaUserTie, FaCode, FaMicrochip, FaTools, FaBolt, FaStar, FaChartLine, FaPlus, FaTrash } from 'react-icons/fa';
import { authAPI, usersAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar.jsx';
import { cn, formatNumber, getStatusBadge } from '../lib/utils';
import { useAppData } from '../context/AppDataContext';

export default function Developers() {
  const [devs, setDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  const [showNew, setShowNew] = useState(
    typeof window !== 'undefined' && window.location.search.includes('new=true')
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'desarrollador',
    position: 'Desarrollador Junior',
    specialty: '',
    phone: ''
  });

  const { addToast } = useAppData();

  const load = async () => {
    try {
      const res = await usersAPI.developers();
      setDevs(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  const availabilityColors = {
    disponible: 'text-neon-green',
    ocupado: 'text-primary-400',
    vacaciones: 'text-neon-yellow',
    ausente: 'text-red-400',
  };

  const mockDevelopers = [
    { id: 1, user: { id: 1, full_name: 'Andrés Rodríguez', email: 'a@robolab.com' }, position: 'Gerente General', specialty: 'Gestión estratégica', availability: 'disponible', status: 'activo', hours_worked: 168, performance_score: 95, compliance_percentage: 98 },
    { id: 2, user: { id: 2, full_name: 'Laura Martínez', email: 'l@robolab.com' }, position: 'Jefe de Desarrollo', specialty: 'Gestión de proyectos', availability: 'ocupado', status: 'activo', hours_worked: 176, performance_score: 92, compliance_percentage: 94 },
    { id: 3, user: { id: 3, full_name: 'Carlos Vega', email: 'c@robolab.com' }, position: 'Programador Senior', specialty: 'Python / React / ROS', availability: 'disponible', status: 'activo', hours_worked: 160, performance_score: 88, compliance_percentage: 90 },
    { id: 4, user: { id: 4, full_name: 'Diana Torres', email: 'd@robolab.com' }, position: 'Ingeniero Electrónico', specialty: 'Diseño de PCB / IoT', availability: 'ocupado', status: 'activo', hours_worked: 164, performance_score: 91, compliance_percentage: 93 },
    { id: 5, user: { id: 5, full_name: 'Esteban López', email: 'e@robolab.com' }, position: 'Diseñador CAD', specialty: 'SolidWorks / Fusion 360', availability: 'disponible', status: 'activo', hours_worked: 152, performance_score: 86, compliance_percentage: 89 },
    { id: 6, user: { id: 6, full_name: 'Fernanda Gómez', email: 'f@robolab.com' }, position: 'Técnico de Laboratorio', specialty: 'Mantenimiento / Calibración', availability: 'vacaciones', status: 'activo', hours_worked: 100, performance_score: 84, compliance_percentage: 87 },
    { id: 7, user: { id: 7, full_name: 'Gabriel Peña', email: 'g@robolab.com' }, position: 'Contador Financiero', specialty: 'Contabilidad / Costos', availability: 'disponible', status: 'activo', hours_worked: 172, performance_score: 94, compliance_percentage: 99 },
  ];

  const display = devs.map(d => ({
    ...d, user: { id: d.user_id || d.id, full_name: d.user?.full_name || `Dev #${d.id}` }
  })).filter(d =>
    !filter ||
    d.position?.toLowerCase().includes(filter.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(filter.toLowerCase()) ||
    (d.user?.full_name || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
            <FaUserTie size={22} className="text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Equipo de Desarrolladores</h2>
            <p className="text-xs text-dark-400">{display.length} miembros · Rendimiento, disponibilidad y especialidades</p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input
              value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Buscar por especialidad..."
              className="input-field !py-2 !pl-8 text-sm w-48"
            />
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="btn-primary !py-2 !px-3 text-sm flex items-center gap-2"
          >
            <FaPlus size={12} /> Nuevo
          </button>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">Nuevo Desarrollador</h3>
            <p className="text-xs text-dark-400 mb-5">Ingresa los datos del nuevo integrante del equipo</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const userRes = await authAPI.register({
                  full_name: form.name,
                  email: form.email,
                  password: form.password,
                  role: form.role,
                  phone: form.phone
                });
                await usersAPI.createDeveloper({
                  position: form.position,
                  specialty: form.specialty,
                  user_id: userRes.data.id
                });
                addToast('Desarrollador creado con éxito', 'success');
                setShowNew(false);
                setForm({ name: '', email: '', password: '', role: 'desarrollador', position: 'Desarrollador Junior', specialty: '', phone: '' });
                load();
              } catch (err) {
                addToast(err?.response?.data?.detail || 'Error al crear desarrollador', 'error');
              } finally {
                setSaving(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Nombre Completo *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Correo Electrónico *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="juan@robolab.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Contraseña *</label>
                  <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="********" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+57 300 000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Cargo / Posición *</label>
                  <input required value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="input-field" placeholder="Ej: Ingeniero Electrónico" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Especialidad</label>
                  <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="input-field" placeholder="Ej: Python / React / Diseño 3D" />
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Crear Desarrollador'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {display.map((d, i) => {
          const full = d.user?.full_name || `Desarrollador ${d.id}`;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card hud-corner relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 blur-3xl rounded-full -translate-y-20 translate-x-20 group-hover:bg-neon-green/10 transition-colors duration-500" />
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar name={full} id={d.user?.id || d.id} size="lg" online={d.availability === 'disponible'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-lg truncate pr-6">{full}</div>
                        <div className="text-xs text-dark-400">{d.position}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[11px] px-2 py-1 rounded-lg capitalize font-semibold whitespace-nowrap',
                          d.availability === 'disponible' ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' :
                          d.availability === 'ocupado' ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30' :
                          d.availability === 'vacaciones' ? 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30' :
                          'bg-red-500/15 text-red-400 border border-red-500/30'
                        )}>
                          {d.availability}
                        </span>
                        <button
                          onClick={async () => {
                            if (window.confirm(`¿Estás seguro de que deseas eliminar a ${full}?`)) {
                              try {
                                await usersAPI.remove(d.user_id || d.user?.id);
                                addToast('Desarrollador eliminado', 'success');
                                load();
                              } catch (e) {
                                addToast('Error al eliminar desarrollador', 'error');
                              }
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center justify-center transition border border-red-500/20"
                          title="Borrar desarrollador"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-dark-300 px-2 py-1 rounded-md bg-dark-700/60 border border-dark-600/40">
                      <FaStar size={9} className="text-neon-yellow" />
                      <span className="font-semibold">{d.specialty || 'Sin especialidad registrada'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-dark-400 flex items-center gap-1"><FaChartLine size={10} /> Rendimiento</span>
                      <span className="font-mono font-bold text-neon-green">{d.performance_score || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${d.performance_score || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-dark-400 flex items-center gap-1"><FaBolt size={10} /> Cumplimiento</span>
                      <span className="font-mono font-bold text-primary-400">{d.compliance_percentage || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${d.compliance_percentage || 0}%`, background: 'linear-gradient(90deg,#a855f7,#00d4ff)' }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dark-600/50 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Horas</div>
                    <div className="font-bold text-neon-blue">{d.hours_worked || 0}h</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Proyectos</div>
                    <div className="font-bold text-neon-green">{3 + (d.id % 5)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Tareas</div>
                    <div className="font-bold text-neon-purple">{5 + (d.id % 10)}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-1.5 opacity-60">
                  {[FaCode, FaMicrochip, FaTools, FaBolt].map((Ic, k) => (
                    <div key={k} className="aspect-square rounded-lg bg-dark-700/40 flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition cursor-pointer">
                      <Ic size={13} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
