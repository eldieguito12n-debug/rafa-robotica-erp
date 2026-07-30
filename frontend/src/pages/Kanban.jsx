import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaColumns, FaPlus, FaSearch, FaEllipsisV, FaCalendar, FaFlag, FaProjectDiagram, FaSyncAlt } from 'react-icons/fa';
import { cn, formatDate, getStatusBadge } from '../lib/utils';
import { tasksAPI, projectsAPI, usersAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar.jsx';
import { useAppData } from '../context/AppDataContext';

const columns = [
  { id: 'pendiente', label: 'Pendiente', color: 'from-neon-yellow/20 to-neon-yellow/5', bar: 'bg-neon-yellow' },
  { id: 'en_proceso', label: 'En Desarrollo', color: 'from-primary-500/20 to-primary-500/5', bar: 'bg-primary-500' },
  { id: 'en_pruebas', label: 'Pruebas', color: 'from-neon-purple/20 to-neon-purple/5', bar: 'bg-neon-purple' },
  { id: 'finalizado', label: 'Finalizado', color: 'from-neon-green/20 to-neon-green/5', bar: 'bg-neon-green' },
  { id: 'cancelado', label: 'Cancelado', color: 'from-red-500/20 to-red-500/5', bar: 'bg-red-500' },
];

const priorities = ['baja', 'media', 'alta', 'urgente'];

const emptyForm = {
  title: '',
  project_id: '',
  assigned_to_id: '',
  priority: 'media',
  status: 'pendiente',
  progress_percentage: 0,
  due_date: '',
  estimated_hours: '',
  description: '',
};

export default function Kanban() {
  const { addToast } = useAppData();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [savingForm, setSavingForm] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (selectedProject) params.project_id = Number(selectedProject);
      const res = await tasksAPI.list(params).catch(() => ({ data: [] }));
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      addToast('Error cargando tareas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.list({ limit: 200 }).catch(() => ({ data: [] }));
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const res = await usersAPI.list({ limit: 200 }).catch(() => ({ data: [] }));
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const cols = useMemo(() => {
    const out = {};
    columns.forEach(c => (out[c.id] = []));
    tasks.forEach(t => {
      const s = String(t.status || t.status?.value || 'pendiente').replace(/['"]/g, '');
      const bucket = out[s] ? s : 'pendiente';
      const proj = projects.find(p => p.id === t.project_id);
      const usr = users.find(u => u.id === t.assigned_to_id);
      out[bucket].push({
        ...t,
        project_name: proj ? proj.name : (t.project_name || `Proyecto #${t.project_id || '-'}`),
        assigned_to_name: t.assigned_to_name || (usr ? usr.full_name : (t.assigned_to_id ? `Usuario #${t.assigned_to_id}` : 'Sin asignar')),
      });
    });
    return out;
  }, [tasks, projects, users]);

  const onDragStart = (e, col, id) => {
    setDragging({ from: col, id });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e, toCol) => {
    if (!dragging || dragging.from === toCol) return;
    const taskId = dragging.id;
    setSaving(taskId);
    try {
      await tasksAPI.updateStatus(taskId, toCol);
      addToast('Tarea actualizada', 'success');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toCol } : t));
    } catch {
      addToast('Error al mover. Reintenta.', 'error');
    } finally {
      setDragging(null);
      setSaving(null);
    }
  };

  const filtered = (list) => !filter ? list : list.filter(c =>
    String(c.title || '').toLowerCase().includes(filter.toLowerCase()) ||
    String(c.assigned_to_name || '').toLowerCase().includes(filter.toLowerCase())
  );

  const openNew = () => {
    setForm({
      ...emptyForm,
      project_id: selectedProject || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      const payload = { ...form };
      if (payload.project_id) payload.project_id = Number(payload.project_id);
      if (payload.assigned_to_id) payload.assigned_to_id = Number(payload.assigned_to_id);
      if (payload.progress_percentage !== '') payload.progress_percentage = Number(payload.progress_percentage);
      if (payload.estimated_hours !== '') payload.estimated_hours = Number(payload.estimated_hours);
      await tasksAPI.create(payload);
      addToast('Tarea creada', 'success');
      setShowModal(false);
      loadTasks();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando tarea', 'error');
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div className="space-y-5 h-[calc(100vh-180px)] flex flex-col min-h-[600px]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
            <FaColumns size={22} className="text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Tablero Kanban</h2>
            <p className="text-xs text-dark-400">Arrastra tareas entre columnas · {tasks.length} tareas</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative flex items-center gap-2 text-xs bg-dark-700/50 rounded-xl p-1 border border-dark-600/40">
            <FaProjectDiagram size={12} className="text-dark-400 ml-2" />
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="bg-transparent outline-none py-1 pr-2 text-sm w-48">
              <option value="">Todos los proyectos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar tareas..." className="input-field !py-2 !pl-8 text-sm w-56" />
          </div>
          <button onClick={loadTasks} className="btn-secondary !px-3 !py-2 !text-sm" title="Refrescar"><FaSyncAlt size={12} /></button>
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12} /> Nueva Tarea</button>
        </div>
      </motion.div>

      {loading && tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-dark-500 text-sm">Cargando tablero...</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-3 -mx-1 px-1">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map(col => {
              const cards = filtered(cols[col.id] || []);
              return (
                <div
                  key={col.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(null, col.id)}
                  className="w-80 lg:w-96 flex-shrink-0 flex flex-col"
                >
                  <div className={`rounded-t-2xl p-3 flex items-center justify-between bg-gradient-to-b ${col.color} border border-dark-600/60 border-b-0`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.bar} shadow-[0_0_10px_currentColor]`} />
                      <div className="font-bold text-sm">{col.label}</div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-dark-800/70 font-mono font-bold">{cards.length}</span>
                    </div>
                    <button className="w-7 h-7 rounded-lg hover:bg-dark-700/70 text-dark-400 hover:text-white flex items-center justify-center">
                      <FaEllipsisV size={11} />
                    </button>
                  </div>
                  <div className="flex-1 rounded-b-2xl border border-dark-600/60 border-t-0 bg-dark-800/30 backdrop-blur-sm p-3 space-y-3 overflow-y-auto min-h-[200px]">
                    {cards.map((c, i) => (
                      <motion.div
                        key={c.id}
                        draggable onDragStart={e => onDragStart(e, col.id, c.id)}
                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ delay: i*0.04 }}
                        className={`glass rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary-500/50 hover:shadow-glow-blue transition-all group ${
                          dragging?.id === c.id ? 'opacity-50 scale-95 rotate-1' : ''
                        } ${saving === c.id ? 'animate-pulse' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary-300 transition">{c.title}</h4>
                          <span className={`${getStatusBadge(c.priority)} !text-[10px] shrink-0`}>{String(c.priority || 'media').toUpperCase()}</span>
                        </div>
                        <div className="text-[11px] px-2 py-0.5 rounded-md bg-dark-700/70 text-dark-300 inline-flex items-center gap-1 mb-3">
                          <FaFlag size={8} className="text-dark-500" /> {c.project_name}
                        </div>
                        {typeof c.progress_percentage === 'number' && c.progress_percentage > 0 && (
                          <div className="mb-3">
                            <div className="w-full h-1.5 rounded-full bg-dark-700 overflow-hidden">
                              <div className={cn('h-full rounded-full', c.progress_percentage >= 100 ? 'bg-neon-green' : 'bg-primary-500')} style={{ width: `${c.progress_percentage}%` }} />
                            </div>
                            <div className="text-[10px] text-dark-500 mt-1">{c.progress_percentage}% completado</div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs border-t border-dark-600/40 pt-3">
                          <div className="flex items-center gap-2">
                            <Avatar size="xs" name={c.assigned_to_name} id={c.assigned_to_id || c.id} />
                            <span className="text-dark-300 truncate max-w-[100px]">{String(c.assigned_to_name).split(' ')[0]}</span>
                          </div>
                          {c.due_date && (
                            <div className={cn('flex items-center gap-1', new Date(c.due_date) < new Date() && c.status !== 'finalizado' ? 'text-red-400' : 'text-dark-500')}>
                              <FaCalendar size={9} />
                              <span className="font-mono text-[10px]">{formatDate(c.due_date, 'short')}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <button onClick={openNew} className="w-full py-2.5 rounded-xl border border-dashed border-dark-600/60 text-dark-500 hover:text-primary-300 hover:border-primary-500/40 hover:bg-primary-500/5 transition text-xs font-semibold flex items-center justify-center gap-1.5">
                      <FaPlus size={10} /> Agregar tarjeta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">Nueva Tarea</h3>
            <p className="text-xs text-dark-400 mb-5">Crea una nueva tarea en el tablero</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Título *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Título de la tarea" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Proyecto</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="input-field">
                    <option value="">Sin proyecto</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Asignado a</label>
                  <select value={form.assigned_to_id} onChange={e => setForm({ ...form, assigned_to_id: e.target.value })} className="input-field">
                    <option value="">Sin asignar</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.name || `Usuario #${u.id}`}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Prioridad</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input-field">
                    {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Estado Inicial</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Progreso (%)</label>
                  <input type="number" min="0" max="100" value={form.progress_percentage} onChange={e => setForm({ ...form, progress_percentage: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Fecha Vencimiento</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Horas Estimadas</label>
                  <input type="number" min="0" step="0.5" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} className="input-field" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Detalles de la tarea..." />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={savingForm} className="btn-primary">{savingForm ? 'Guardando...' : 'Crear Tarea'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
