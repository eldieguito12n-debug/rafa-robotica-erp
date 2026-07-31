import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaPlus, FaTasks, FaFilter, FaEdit, FaTrash, FaCalendarAlt, FaComment, FaPaperclip, FaFlag, FaUser, FaProjectDiagram, FaEllipsisV, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { tasksAPI, projectsAPI, usersAPI } from '../lib/api';
import { cn, formatDate, formatDateTime } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import RoleGuard from '../components/ui/RoleGuard.jsx';

const statuses = ['','pendiente','en_proceso','en_pruebas','finalizado','pausado','cancelado'];
const priorities = ['','baja','media','alta','urgente','critica'];

const getTaskStatusBadge = (status, overdue) => {
  if (status === 'finalizado') return 'bg-neon-green/10 text-neon-green border-neon-green/30';
  if (overdue) return 'bg-red-500/10 text-red-400 border-red-500/30 font-bold';
  if (status === 'en_proceso') return 'bg-neon-blue/10 text-neon-blue border-neon-blue/30';
  return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30';
};

const getTaskStatusIcon = (status, overdue) => {
  if (status === 'finalizado') return '🟢';
  if (overdue) return '🔴';
  if (status === 'en_proceso') return '🔵';
  return '🟡';
};

const priorityColors = {
  baja: 'bg-neon-green/10 text-neon-green border-neon-green/30',
  media: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
  alta: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30',
  urgente: 'bg-neon-orange/10 text-neon-yellow border-neon-yellow/40',
  critica: 'bg-red-500/15 text-red-400 border-red-500/40 animate-pulse',
};

export default function Tasks() {
  const { isAdmin, user } = useAuth();
  const { addToast } = useAppData();
  const admin = isAdmin();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [view, setView] = useState('table');

  const [showNew, setShowNew] = useState(
    typeof window !== 'undefined' && window.location.search.includes('new=true')
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_id: 1,
    priority: 'media',
    status: 'pendiente',
    start_date: '',
    due_date: '',
    estimated_hours: 8,
    assigned_to_id: '',
  });

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [resTasks, resProj, resUsers] = await Promise.all([
        tasksAPI.list({
          status: status || undefined,
          priority: priority || undefined,
          limit: 100,
        }),
        projectsAPI.list({ limit: 100 }),
        usersAPI.list({ limit: 1000 })
      ]);
      setTasks(resTasks.data);
      setProjects(resProj.data);
      setUsers(resUsers.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, priority]);

  const handleAddQuickTask = () => {
    if (!admin) return;
    setForm({
      title: '',
      description: '',
      project_id: '',
      priority: 'media',
      status: 'pendiente',
      start_date: '',
      due_date: '',
      estimated_hours: 8,
      assigned_to_id: '',
    });
    setShowNew(true);
  };

  const handleDelete = async (t) => {
    if (!confirm(`¿Eliminar tarea "${t.title}"?`)) return;
    try {
      await tasksAPI.remove(t.id);
      addToast('Tarea eliminada correctamente', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Error eliminando tarea', 'error');
      console.error(err);
    }
  };

  const handleFinalize = async (t) => {
    if (!confirm(`¿Estás seguro de marcar la tarea "${t.title}" como finalizada?`)) return;
    try {
      await tasksAPI.finalize(t.id);
      addToast('Tarea finalizada exitosamente', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Error al finalizar tarea', 'error');
    }
  };

  const [selectedTaskHistory, setSelectedTaskHistory] = useState(null);

  const mock = [
    { id: 1, title: 'Diseñar chasis del robot autónomo v2', project_id: 1, project_name: 'Robot Autónomo', assigned_to_name: 'Esteban López', created_by_id: 2, priority: 'alta', status: 'finalizado', progress_percentage: 100, due_date: '2025-02-10', estimated_hours: 24, actual_hours: 22, description: 'Diseño CAD del chasis principal con materiales ligeros' },
    { id: 2, title: 'Integrar sensor LIDAR con placa controladora', project_id: 1, project_name: 'Robot Autónomo', assigned_to_name: 'Diana Torres', priority: 'urgente', status: 'en_proceso', progress_percentage: 60, due_date: '2025-08-05', estimated_hours: 40, actual_hours: 26, description: 'Conexionado y testing de LIDAR RPLIDAR A1' },
    { id: 3, title: 'Desarrollar algoritmo navegación SLAM', project_id: 1, project_name: 'Robot Autónomo', assigned_to_name: 'Carlos Vega', priority: 'alta', status: 'en_proceso', progress_percentage: 40, due_date: '2025-08-12', estimated_hours: 80, actual_hours: 35, description: 'Implementar ROS SLAM Toolbox' },
    { id: 4, title: 'Diseñar PCB de control principal', project_id: 1, project_name: 'Robot Autónomo', assigned_to_name: 'Diana Torres', priority: 'media', status: 'pendiente', progress_percentage: 0, due_date: '2025-08-09', estimated_hours: 32, actual_hours: 0, description: 'Diseño en KiCad con STM32 como MCU' },
    { id: 5, title: 'Configurar sensores ambientales (temp/humedad)', project_id: 2, project_name: 'Sistema IoT Agrícola', assigned_to_name: 'Diana Torres', priority: 'media', status: 'pendiente', progress_percentage: 0, due_date: '2025-08-01', estimated_hours: 16, actual_hours: 0 },
    { id: 6, title: 'Crear dashboard web de monitoreo IoT', project_id: 2, project_name: 'Sistema IoT Agrícola', assigned_to_name: 'Carlos Vega', priority: 'alta', status: 'en_proceso', progress_percentage: 50, due_date: '2025-08-06', estimated_hours: 48, actual_hours: 24 },
    { id: 7, title: 'Calibración final de ejes del brazo', project_id: 3, project_name: 'Brazo 6DOF', assigned_to_name: 'Fernanda Gómez', priority: 'baja', status: 'finalizado', progress_percentage: 100, due_date: '2024-12-10', estimated_hours: 20, actual_hours: 18 },
    { id: 8, title: 'Entrenar modelo de visión para defectos', project_id: 4, project_name: 'Detección de Defectos', assigned_to_name: 'Carlos Vega', priority: 'alta', status: 'en_pruebas', progress_percentage: 85, due_date: '2025-08-01', estimated_hours: 120, actual_hours: 105 },
    { id: 9, title: 'Integración cámara térmica drone', project_id: 5, project_name: 'Drone Inspección', assigned_to_name: 'Diana Torres', priority: 'media', status: 'pausado', progress_percentage: 20, due_date: '2025-09-15', estimated_hours: 40, actual_hours: 8 },
    { id: 10, title: 'Tests de batería y autonomía', project_id: 1, project_name: 'Robot Autónomo', assigned_to_name: 'Fernanda Gómez', priority: 'media', status: 'pendiente', progress_percentage: 0, due_date: '2025-08-20', estimated_hours: 24, actual_hours: 0 },
  ];
  const list = tasks.map(t => ({
    ...t, 
    project_name: t.project?.name || `Proyecto #${t.project_id}`, 
    assigned_to_name: t.assigned_to?.full_name || (t.assigned_to_id ? `Usuario #${t.assigned_to_id}` : 'Sin asignar'),
  }))
  .filter(t =>
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.project_name || '').toLowerCase().includes(search.toLowerCase())) &&
    (!status || t.status === status) &&
    (!priority || t.priority === priority)
  );

  const counts = {
    pendiente: list.filter(t => t.status === 'pendiente').length,
    en_proceso: list.filter(t => t.status === 'en_proceso').length,
    en_pruebas: list.filter(t => t.status === 'en_pruebas').length,
    finalizado: list.filter(t => t.status === 'finalizado').length,
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
            <FaTasks size={22} className="text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Gestión de Tareas</h2>
            <p className="text-xs text-dark-400">{list.length} tareas · Asignación, seguimiento y control de avance</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs bg-dark-700/50 rounded-xl p-1 border border-dark-600/40">
            {['table','grid'].map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 rounded-lg capitalize font-semibold transition', view === v ? 'bg-primary-600/30 text-primary-200 border border-primary-500/40' : 'text-dark-400 hover:text-white')}>
                {v}
              </button>
            ))}
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea..." className="input-field !py-2 !pl-8 text-sm w-48" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-field !py-2 text-sm w-36">
            <option value="">Todos estados</option>
            {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field !py-2 text-sm w-36">
            <option value="">Todas prioridades</option>
            {priorities.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFilter size={12} /></button>
          <RoleGuard adminOnly>
            <button className="btn-primary !px-3 !py-2 !text-sm" onClick={handleAddQuickTask}><FaPlus size={12} /> Nueva Tarea</button>
          </RoleGuard>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pendientes" value={counts.pendiente} color="warning" icon={FaCalendarAlt} />
        <StatCard label="En Proceso" value={counts.en_proceso} color="info" icon={FaFlag} />
        <StatCard label="En Pruebas" value={counts.en_pruebas} color="primary" icon={FaComment} />
        <StatCard label="Finalizadas" value={counts.finalizado} color="success" icon={FaPaperclip} />
      </div>

      {view === 'table' ? (
        <div className="card hud-corner !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-800/70 border-b border-dark-600/60 text-xs uppercase tracking-wider text-dark-400">
                <tr>
                  <th className="text-left py-3 px-4">Tarea</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Proyecto</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Responsable</th>
                  <th className="text-left py-3 px-4">Prioridad</th>
                  <th className="text-left py-3 px-4 hidden sm:table-cell">Vence</th>
                  <th className="text-left py-3 px-4 min-w-[160px]">Progreso</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-right py-3 px-4"><FaEllipsisV /></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="py-10 text-center"><span className="w-6 h-6 inline-block border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></td></tr>}
                {!loading && list.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-dark-500">{admin ? 'Sin resultados' : 'No tienes tareas asignadas'}</td></tr>}
                {list.map((t, i) => {
                  const overdue = t.due_date && t.status !== 'finalizado' && new Date(t.due_date) < new Date();
                  return (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i*0.02 }} className="border-b border-dark-700/40 hover:bg-primary-500/5 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-dark-700/50 flex items-center justify-center text-dark-400 flex-shrink-0">
                            <FaTasks size={13} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold leading-snug">{t.title}</div>
                            {t.estimated_hours > 0 && (
                              <div className="text-[11px] text-dark-500 mt-0.5">⏱ {t.actual_hours}/{t.estimated_hours}h</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-primary-300"><FaProjectDiagram size={10} />{t.project_name}</div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={t.assigned_to_name} id={t.id} size="xs" />
                          <span className="text-xs truncate">{t.assigned_to_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs px-2.5 py-1 rounded-lg border font-semibold capitalize', priorityColors[t.priority] || priorityColors.media)}>{t.priority}</span>
                      </td>
                      <td className={`py-3 px-4 text-xs hidden sm:table-cell ${overdue ? 'text-red-400 font-bold' : 'text-dark-400'}`}>
                        {formatDate(t.due_date) || '—'}
                        {overdue && ' ⚠'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${t.progress_percentage}%` }} /></div>
                          <span className="text-xs font-mono w-9 text-right">{t.progress_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg border ${getTaskStatusBadge(t.status, overdue)}`}>
                          {getTaskStatusIcon(t.status, overdue)} {overdue ? 'Atrasada' : String(t.status).replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedTaskHistory(t)} className="w-7 h-7 rounded-lg hover:bg-dark-500/15 text-dark-300 flex items-center justify-center" title="Ver Historial"><FaHistory size={11} /></button>
                          
                          <RoleGuard adminOnly>
                            {t.status !== 'finalizado' && (
                              <button onClick={() => handleFinalize(t)} className="w-7 h-7 rounded-lg hover:bg-neon-green/15 text-neon-green flex items-center justify-center" title="Finalizar tarea"><FaCheckCircle size={11} /></button>
                            )}
                            <button className="w-7 h-7 rounded-lg hover:bg-primary-500/15 text-primary-400 flex items-center justify-center" title="Editar"><FaEdit size={11} /></button>
                            <button onClick={(e) => { e.preventDefault(); handleDelete(t); }} className="w-7 h-7 rounded-lg hover:bg-red-500/15 text-red-400 flex items-center justify-center" title="Eliminar"><FaTrash size={11} /></button>
                          </RoleGuard>
                          {!admin && t.assigned_to_id === user?.id && (
                            <button className="w-7 h-7 rounded-lg hover:bg-primary-500/15 text-primary-400 flex items-center justify-center" title="Ver / Actualizar progreso"><FaEdit size={11} /></button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.03 }} className="card hud-corner hover:shadow-glow-blue transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded border text-[10px] ${getTaskStatusBadge(t.status, t.due_date && t.status !== 'finalizado' && new Date(t.due_date) < new Date())}`}>
                  {getTaskStatusIcon(t.status, t.due_date && t.status !== 'finalizado' && new Date(t.due_date) < new Date())} {t.due_date && t.status !== 'finalizado' && new Date(t.due_date) < new Date() ? 'Atrasada' : String(t.status).replace(/_/g,' ')}
                </span>
                <span className={`${getStatusBadge(t.priority)} !text-[10px]`}>{t.priority.toUpperCase()}</span>
              </div>
              <h4 className="font-bold text-base mb-2 line-clamp-2">{t.title}</h4>
              {t.project_name && <div className="text-[11px] text-primary-300 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-500/10 mb-3"><FaProjectDiagram size={9} /> {t.project_name}</div>}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-dark-400">Progreso</span>
                  <span className="font-mono font-bold">{t.progress_percentage}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${t.progress_percentage}%` }} /></div>
              </div>
              <div className="flex items-center justify-between text-xs text-dark-400 border-t border-dark-600/40 pt-3">
                <div className="flex items-center gap-1.5"><FaCalendarAlt size={10} /> {formatDate(t.due_date) || 'Sin fecha'}</div>
                <div className="flex items-center gap-1.5"><FaUser size={10} /> {t.assigned_to_name?.split(' ')[0] || 'Sin asignar'}</div>
              </div>
              <div className="flex items-center gap-1.5 justify-end mt-2 pt-2 border-t border-dark-600/20">
                <button onClick={() => setSelectedTaskHistory(t)} className="text-dark-300 hover:text-white text-xs font-semibold flex items-center gap-1"><FaHistory size={10}/> Historial</button>
                <RoleGuard adminOnly>
                  {t.status !== 'finalizado' && (
                    <button onClick={() => handleFinalize(t)} className="text-neon-green hover:text-green-300 text-xs font-semibold flex items-center gap-1 ml-2"><FaCheckCircle size={10}/> Finalizar</button>
                  )}
                  <button onClick={() => handleDelete(t)} className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 ml-2"><FaTrash size={10}/> Eliminar</button>
                </RoleGuard>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">Nueva Tarea</h3>
            <p className="text-xs text-dark-400 mb-5">Creación de tarea para el tablero y cronograma</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await tasksAPI.create({
                  title: form.title,
                  description: form.description,
                  project_id: form.project_id ? Number(form.project_id) : null,
                  priority: form.priority,
                  status: form.status,
                  assigned_to_id: form.assigned_to_id || null,
                  progress_percentage: 0,
                  start_date: form.start_date || null,
                  due_date: form.due_date || null,
                  estimated_hours: Number(form.estimated_hours)
                });
                setShowNew(false);
                addToast('Tarea creada exitosamente', 'success');
                load();
              } catch (err) {
                addToast(err.response?.data?.detail || 'Error creando tarea', 'error');
                console.error(err);
              } finally {
                setSaving(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Título de la Tarea *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Ej: Diseñar placa base..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Proyecto</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="input-field">
                    <option value="">Selecciona un proyecto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Asignar A (Opcional)</label>
                  <select value={form.assigned_to_id || ''} onChange={e => setForm({ ...form, assigned_to_id: e.target.value ? Number(e.target.value) : null })} className="input-field">
                    <option value="">Sin Asignar</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({String(u.role).replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Prioridad</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input-field">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Inicio (Opcional)</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Vence (Opcional)</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Estado Inicial</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Horas Estimadas</label>
                  <input type="number" min="0" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} className="input-field" placeholder="8" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Descripción (Opcional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Detalles de la tarea..." />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Crear Tarea'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {selectedTaskHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setSelectedTaskHistory(null)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-lg w-full mx-auto p-6 shadow-glass relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold heading-glow">Historial de la Tarea</h3>
                <p className="text-sm text-dark-400">{selectedTaskHistory.title}</p>
              </div>
              <button onClick={() => setSelectedTaskHistory(null)} className="text-dark-400 hover:text-white">&times;</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3 bg-dark-800/50 rounded-xl border border-dark-600/30 text-sm">
                <div className="text-xs text-dark-400 mb-1">Responsable asignado:</div>
                <div className="font-semibold">{selectedTaskHistory.assigned_to_name}</div>
              </div>
              
              <div className="relative pl-4 border-l-2 border-dark-600/50 space-y-4 py-2">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-dark-400"></div>
                  <div className="text-xs text-dark-400">{formatDateTime(selectedTaskHistory.created_at)}</div>
                  <div className="font-medium text-sm">Tarea Creada</div>
                  <div className="text-xs text-dark-500">Por {selectedTaskHistory.created_by_id ? `Usuario #${selectedTaskHistory.created_by_id}` : 'Sistema'}</div>
                </div>

                {(selectedTaskHistory.history || []).map((ev, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-neon-blue"></div>
                    <div className="text-xs text-dark-400">{formatDateTime(ev.at)}</div>
                    <div className="font-medium text-sm">
                      {ev.event === 'finalized' ? 'Tarea Finalizada' : ev.event}
                    </div>
                    <div className="text-xs text-dark-500">
                      Por Usuario #{ev.by}
                    </div>
                  </div>
                ))}

                {selectedTaskHistory.status === 'finalizado' && !selectedTaskHistory.history?.length && selectedTaskHistory.completed_at && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-neon-green"></div>
                    <div className="text-xs text-dark-400">{formatDateTime(selectedTaskHistory.completed_at)}</div>
                    <div className="font-medium text-sm">Tarea Aprobada y Finalizada</div>
                    <div className="text-xs text-dark-500">Por Usuario #{selectedTaskHistory.approved_by_id}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelectedTaskHistory(null)} className="btn-secondary">Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value, color, icon: Ic }) {
  const map = {
    warning: 'from-neon-yellow/20 to-neon-yellow/5 border-neon-yellow/30 text-neon-yellow',
    info: 'from-neon-blue/20 to-neon-blue/5 border-neon-blue/30 text-neon-blue',
    primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/30 text-primary-300',
    success: 'from-neon-green/20 to-neon-green/5 border-neon-green/30 text-neon-green',
  };
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${map[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark-300 font-semibold">{label}</span>
        <Ic size={14} />
      </div>
      <div className="text-3xl font-black neon-text">{value}</div>
    </div>
  );
}
