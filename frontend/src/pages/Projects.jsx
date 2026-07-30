import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaSearch, FaPlus, FaProjectDiagram, FaFilter, FaArrowRight,
  FaUserTie, FaCalendarAlt, FaDollarSign, FaDownload, FaEdit, FaTrash,
} from 'react-icons/fa';
import { projectsAPI, clientsAPI } from '../lib/api';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';
import { useAppData } from '../context/AppDataContext';

const statuses = ['planeacion','en_progreso','en_pruebas','finalizado','pausado','cancelado'];

const emptyForm = {
  name: '',
  client_id: '',
  description: '',
  budget: '',
  start_date: '',
  end_date: '',
  status: 'planeacion',
};

export default function Projects() {
  const { addToast } = useAppData();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const r = await clientsAPI.list({ limit: 200 });
      setClients(Array.isArray(r.data) ? r.data : []);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.list({ search: search || undefined, status: status || undefined, limit: 50 });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      addToast('Error cargando proyectos', 'error');
      setProjects([]);
    } finally { setLoading(false); }
  }, [search, status, addToast]);

  useEffect(() => { load(); loadClients(); }, [search, status]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || '',
      client_id: p.client_id || '',
      description: p.description || '',
      budget: p.budget_value || p.budget || '',
      start_date: p.start_date ? String(p.start_date).slice(0,10) : '',
      end_date: p.end_date ? String(p.end_date).slice(0,10) : '',
      status: p.status || 'planeacion',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (payload.budget) payload.budget_value = Number(payload.budget);
    delete payload.budget;
    if (payload.client_id) payload.client_id = Number(payload.client_id);
    else payload.client_id = null;
    try {
      if (editing) {
        await projectsAPI.update(editing, payload);
        addToast('Proyecto actualizado', 'success');
      } else {
        await projectsAPI.create(payload);
        addToast('Proyecto creado', 'success');
      }
      setShowModal(false);
      load();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando proyecto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar proyecto "${p.name}"?`)) return;
    try {
      await projectsAPI.remove(p.id);
      addToast('Proyecto eliminado', 'success');
      load();
    } catch {
      addToast('Error eliminando proyecto', 'error');
    }
  };

  const list = projects;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
            <FaProjectDiagram size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Gestión de Proyectos</h2>
            <p className="text-xs text-dark-400">{list.length} proyectos · Seguimiento, cronograma y equipo asignado</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-44" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-field !py-2 text-sm w-40">
            <option value="">Todos estados</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFilter size={12} /></button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12} /></button>
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12} /> Nuevo Proyecto</button>
        </div>
      </motion.div>

      {loading && list.length === 0 ? (
        <div className="text-center py-16 text-dark-500">Cargando proyectos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card hud-corner relative overflow-hidden group hover:shadow-glow-blue transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={getStatusBadge(p.status)}>{String(p.status).replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-dark-500 font-mono">#P-{String(p.id).padStart(4,'0')}</span>
                  </div>
                  <Link to={`/projects/${p.id}`} className="font-bold text-lg hover:text-primary-300 transition line-clamp-1">
                    {p.name}
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.preventDefault(); openEdit(p); }} className="w-8 h-8 rounded-lg bg-dark-700/60 hover:bg-primary-600/30 hover:text-primary-300 flex items-center justify-center transition" title="Editar">
                    <FaEdit size={11} />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); handleDelete(p); }} className="w-8 h-8 rounded-lg bg-dark-700/60 hover:bg-red-600/30 hover:text-red-300 flex items-center justify-center transition" title="Eliminar">
                    <FaTrash size={11} />
                  </button>
                  <Link to={`/projects/${p.id}`} className="w-9 h-9 rounded-xl bg-dark-700/60 hover:bg-primary-600/30 hover:text-primary-300 flex items-center justify-center transition group-hover:translate-x-0.5">
                    <FaArrowRight size={13} />
                  </Link>
                </div>
              </div>
              <p className="text-xs text-dark-400 line-clamp-2 min-h-[32px] mb-4">{p.description || 'Sin descripción'}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-dark-400">Progreso</span>
                  <span className="font-mono font-bold text-white">{p.progress_percentage || 0}%</span>
                </div>
                <div className="progress-bar h-2.5">
                  <div
                    className="progress-fill h-full"
                    style={{
                      width: `${p.progress_percentage || 0}%`,
                      background: p.status === 'finalizado' ? 'linear-gradient(90deg,#00ff88,#00d4ff)' :
                                  p.status === 'cancelado' ? 'linear-gradient(90deg,#ff5577,#ff8800)' : undefined,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="p-2 rounded-lg bg-dark-700/40 border border-dark-600/40">
                  <div className="text-dark-500 flex items-center gap-1"><FaCalendarAlt size={9} /> Inicio</div>
                  <div className="font-semibold text-dark-200">{formatDate(p.start_date) || '—'}</div>
                </div>
                <div className="p-2 rounded-lg bg-dark-700/40 border border-dark-600/40">
                  <div className="text-dark-500 flex items-center gap-1"><FaCalendarAlt size={9} /> Entrega</div>
                  <div className="font-semibold text-dark-200">{formatDate(p.end_date) || '—'}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-600/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[0,1,2].map(k => (
                      <div key={k} className={cn('w-7 h-7 rounded-lg border-2 border-dark-800 bg-gradient-to-br',
                        k===0?'from-primary-500 to-primary-700':k===1?'from-neon-green to-emerald-700':'from-neon-purple to-fuchsia-700')} />
                    ))}
                    <div className="w-7 h-7 rounded-lg border-2 border-dark-800 bg-dark-700 text-[10px] font-bold flex items-center justify-center text-dark-300">
                      +3
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-dark-500 flex items-center justify-end gap-1"><FaDollarSign size={9} /> Presupuesto</div>
                  <div className="font-mono font-bold text-neon-green text-xs">{formatCurrency(p.budget_value || p.budget)}</div>
                </div>
              </div>
            </motion.div>
          ))}
          {list.length === 0 && !loading && <div className="col-span-full text-center py-12 text-dark-500">No hay proyectos para mostrar</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">{editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
            <p className="text-xs text-dark-400 mb-5">Completa los datos del proyecto</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Nombre del Proyecto *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Ej: Robot Autónomo..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Cliente</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="input-field">
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name || `Cliente #${c.id}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Estado *</label>
                  <select required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Descripción breve..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Presupuesto</label>
                  <input type="number" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Fecha Inicio</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Fecha Fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : (editing ? 'Guardar Cambios' : 'Crear Proyecto')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
