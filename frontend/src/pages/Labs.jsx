import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaFlask, FaPlus, FaSearch, FaEdit, FaCogs, FaUsers, FaMapMarkerAlt, FaSignal, FaCog, FaCircle, FaTrash } from 'react-icons/fa';
import { labsAPI, usersAPI } from '../lib/api';
import { cn } from '../lib/utils';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import RoleGuard from '../components/ui/RoleGuard.jsx';

const labStatuses = ['operativo','disponible','ocupado','mantenimiento'];

const emptyForm = {
  name: '',
  location: '',
  manager_id: '',
  description: '',
  equipment_list: '',
  status: 'operativo',
};

export default function Labs() {
  const { addToast } = useAppData();
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [labs, setLabs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await labsAPI.list();
      setLabs(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      addToast('Error cargando laboratorios', 'error');
      setLabs([]);
    } finally { setLoading(false); }
  }, [addToast]);

  const loadUsers = useCallback(async () => {
    try {
      const r = await usersAPI.list({ limit: 200 });
      setUsers(Array.isArray(r.data) ? r.data : []);
    } catch {}
  }, []);

  useEffect(() => { load(); loadUsers(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (lab) => {
    setEditing(lab.id);
    const eq = lab.equipment_list || lab.equipment;
    setForm({
      name: lab.name || '',
      location: lab.location || '',
      manager_id: lab.manager_id || '',
      description: lab.description || '',
      equipment_list: Array.isArray(eq) ? eq.join('\n') : (eq || ''),
      status: lab.status || 'operativo',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (payload.manager_id) payload.manager_id = Number(payload.manager_id);
    try {
      if (editing) {
        await labsAPI.update(editing, payload);
        addToast('Laboratorio actualizado', 'success');
      } else {
        await labsAPI.create(payload);
        addToast('Laboratorio creado', 'success');
      }
      setShowModal(false);
      load();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando laboratorio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lab) => {
    if (!confirm(`¿Eliminar laboratorio "${lab.name}"?`)) return;
    try {
      await labsAPI.remove(lab.id);
      addToast('Laboratorio eliminado', 'success');
      load();
    } catch {
      addToast('Error eliminando laboratorio', 'error');
    }
  };

  const list = (labs || []).filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusMap = {
    operativo: { color: 'neon-green', label: 'Operativo', desc: 'En funcionamiento normal' },
    disponible: { color: 'primary-400', label: 'Disponible', desc: 'Libre para reservar' },
    ocupado: { color: 'neon-blue', label: 'Ocupado', desc: 'En uso actualmente' },
    mantenimiento: { color: 'neon-yellow', label: 'Mantenimiento', desc: 'Temporalmente fuera de servicio' },
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
            <FaFlask size={22} className="text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Estado de Laboratorios</h2>
            <p className="text-xs text-dark-400">Monitorea disponibilidad, capacidad y equipos de cada espacio</p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar laboratorio..." className="input-field !py-2 !pl-8 text-sm w-56"/></div>
          <RoleGuard adminOnly>
            <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12}/> Nuevo</button>
          </RoleGuard>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(statusMap).map(([k, v]) => {
          const n = list.filter(l => l.status === k).length;
          return (
            <div key={k} className="card !p-4 flex items-center gap-3">
              <div className="relative">
                <FaCircle size={30} className={`text-${v.color} opacity-20`}/>
                <FaCircle size={14} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-${v.color}`}/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider font-bold text-dark-400">{v.label}</div>
                <div className="text-2xl font-black">{n}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && list.length === 0 ? (
          <div className="col-span-full text-center py-16 text-dark-500">Cargando laboratorios...</div>
        ) : (
          list.map((lab, i) => {
            const s = statusMap[lab.status] || statusMap.operativo;
            const equip = Array.isArray(lab.equipment) ? lab.equipment : (lab.equipment_list ? lab.equipment_list.split('\n').filter(Boolean) : []);
            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i*0.05 }}
                className="card hud-corner overflow-hidden hover:shadow-glow-blue transition-all group relative"
              >
                <div className="h-32 relative mb-4 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 rounded-xl overflow-hidden border border-dark-600/50">
                  <div className="absolute inset-0 grid-bg opacity-50" />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className={cn('text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border flex items-center gap-1.5',
                      lab.status === 'operativo' ? 'bg-neon-green/15 text-neon-green border-neon-green/40' :
                      lab.status === 'disponible' ? 'bg-primary-500/15 text-primary-300 border-primary-500/40' :
                      lab.status === 'mantenimiento' ? 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/40 animate-pulse-slow' :
                      'bg-neon-blue/15 text-neon-blue border-neon-blue/40'
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full current-bg-current" style={{background: 'currentColor'}}/>{s.label}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="text-[10px] font-mono text-dark-400 bg-dark-900/60 px-2 py-1 rounded backdrop-blur border border-dark-700/50">{lab.code || `LAB-${lab.id}`}</div>
                    <div className="text-[10px] px-2 py-1 rounded bg-dark-900/60 backdrop-blur border border-dark-700/50 text-dark-300 flex items-center gap-1.5"><FaUsers size={9}/>Cap. {lab.capacity || '-'}</div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-dark-900/80 to-transparent" />
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-xl leading-tight">{lab.name}</h3>
                    <div className="text-xs text-dark-400 flex items-center gap-1.5 mt-1"><FaMapMarkerAlt size={9}/>{lab.location || 'Ubicación no especificada'}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <RoleGuard adminOnly>
                      <button onClick={() => openEdit(lab)} className="w-9 h-9 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-primary-300 flex items-center justify-center"><FaEdit size={13}/></button>
                      <button onClick={() => handleDelete(lab)} className="w-9 h-9 rounded-lg hover:bg-red-600/20 text-dark-400 hover:text-red-300 flex items-center justify-center"><FaTrash size={13}/></button>
                    </RoleGuard>
                  </div>
                </div>
                <p className="text-xs text-dark-300 leading-relaxed min-h-[48px] mb-4 line-clamp-3">{lab.description}</p>

                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-dark-400 mb-2 flex items-center gap-1.5"><FaCogs size={10}/> Equipamiento ({equip.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {equip.slice(0, 4).map(eq => (
                      <span key={eq} className="text-[10px] px-2 py-1 rounded-md bg-dark-700/60 border border-dark-600/40 text-dark-300 line-clamp-1 max-w-full">{eq}</span>
                    ))}
                    {equip.length > 4 && <span className="text-[10px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-300 border border-primary-500/30 font-bold">+{equip.length - 4} más</span>}
                    {equip.length === 0 && <span className="text-[10px] text-dark-500">Sin equipos registrados</span>}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-dark-600/40 pt-3">
                  <button className="btn-secondary !py-2 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaSignal size={10}/> Detalles</button>
                  <button className="btn-primary !py-2 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaCog size={10}/> Reservar</button>
                </div>
              </motion.div>
            );
          })
        )}
        {!loading && list.length === 0 && <div className="col-span-full text-center py-12 text-dark-500">No hay laboratorios para mostrar</div>}
      </div>

      {showModal && admin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">{editing ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}</h3>
            <p className="text-xs text-dark-400 mb-5">Datos del laboratorio</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Nombre *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Ej: Laboratorio IoT" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Ubicación</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="Ej: Edificio A · Piso 1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Responsable</label>
                  <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} className="input-field">
                    <option value="">Seleccionar responsable...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.name || `Usuario #${u.id}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {labStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field min-h-[70px]" placeholder="Descripción del laboratorio..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Equipamiento (uno por línea)</label>
                <textarea value={form.equipment_list} onChange={e => setForm({ ...form, equipment_list: e.target.value })} className="input-field min-h-[100px] font-mono text-xs" placeholder="Raspberry Pi 4 (x10)&#10;ESP32 Dev Kits (x20)&#10;Osciloscopios (x2)" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : (editing ? 'Guardar Cambios' : 'Crear Laboratorio')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
