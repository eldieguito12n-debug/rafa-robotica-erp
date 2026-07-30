import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaSearch, FaCalendarCheck,
  FaGift, FaFlag, FaFlask, FaHandshake, FaUserFriends, FaRegClock, FaSyncAlt, FaTrash,
} from 'react-icons/fa';
import { cn, formatDate } from '../lib/utils';
import { calendarAPI, usersAPI, projectsAPI } from '../lib/api';
import { useAppData } from '../context/AppDataContext';
import Avatar from '../components/ui/Avatar.jsx';

const defaultColors = ['primary', 'neon-green', 'neon-yellow', 'neon-purple', 'neon-blue', 'red'];

const emptyForm = {
  title: '',
  description: '',
  date: new Date().toISOString().slice(0,10),
  start_time: '09:00',
  end_time: '10:00',
  all_day: false,
  project_id: '',
  assigned_to_ids: '',
  color: 'primary',
};

const typeGuess = (title) => {
  const t = String(title || '').toLowerCase();
  if (t.includes('entrega') || t.includes('demo')) return { type: 'entrega', color: 'neon-green', Icon: FaFlag };
  if (t.includes('reun') || t.includes('cliente') || t.includes('visita')) return { type: 'reunion', color: 'primary', Icon: FaHandshake };
  if (t.includes('cumple')) return { type: 'cumpleanos', color: 'neon-purple', Icon: FaGift };
  if (t.includes('manten') || t.includes('lab')) return { type: 'mantenimiento', color: 'neon-yellow', Icon: FaFlask };
  if (t.includes('factura') || t.includes('venc')) return { type: 'vencimiento', color: 'red', Icon: FaRegClock };
  if (t.includes('pago') || t.includes('nómina') || t.includes('nomina')) return { type: 'pago', color: 'neon-green', Icon: FaCalendarAlt };
  return { type: 'tarea', color: 'neon-blue', Icon: FaCalendarCheck };
};

const colorMap = {
  'neon-green': 'bg-neon-green/15 text-neon-green border-neon-green/40',
  'primary': 'bg-primary-500/15 text-primary-300 border-primary-500/40',
  'neon-yellow': 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/40',
  'neon-purple': 'bg-neon-purple/15 text-neon-purple border-neon-purple/40',
  'neon-blue': 'bg-neon-blue/15 text-neon-blue border-neon-blue/40',
  'red': 'bg-red-500/15 text-red-400 border-red-500/40',
};

export default function Calendar() {
  const { addToast } = useAppData();
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const [view, setView] = useState('month');
  const [filter, setFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const month = current.getMonth();
  const year = current.getFullYear();

  const loadData = async () => {
    setLoading(true);
    try {
      const first = new Date(year, month, 1).toISOString().slice(0, 10);
      const last = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      const res = await calendarAPI.list({ date_from: first, date_to: last }).catch(() => ({ data: [] }));
      const arr = Array.isArray(res.data) ? res.data : [];
      setEvents(arr);
      try {
        const [u, p] = await Promise.allSettled([usersAPI.list({ limit: 100 }), projectsAPI.list({ limit: 200 })]);
        if (u.status === 'fulfilled') setUsers(Array.isArray(u.value.data) ? u.value.data : []);
        if (p.status === 'fulfilled') setProjects(Array.isArray(p.value.data) ? p.value.data : []);
      } catch {}
    } catch {
      addToast('Error cargando calendario', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const openNew = () => {
    const selDate = new Date(year, month, selected).toISOString().slice(0,10);
    setForm({ ...emptyForm, date: selDate });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.project_id) payload.project_id = Number(payload.project_id);
      if (payload.assigned_to_ids) {
        if (typeof payload.assigned_to_ids === 'string') {
          payload.assigned_to_ids = payload.assigned_to_ids
            .split(/[,\s]+/).map(s => Number(s.trim())).filter(n => !isNaN(n));
        }
      } else {
        payload.assigned_to_ids = [];
      }
      if (payload.all_day) {
        payload.start_time = null;
        payload.end_time = null;
      }
      await calendarAPI.create(payload);
      addToast('Evento creado', 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando evento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const dayEventsMap = useMemo(() => {
    const out = {};
    events.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!out[day]) out[day] = [];
        const guess = typeGuess(e.title);
        const color = e.color && colorMap[e.color] ? e.color : guess.color;
        out[day].push({
          ...e,
          _color: color,
          _type: guess.type,
          _Icon: guess.Icon,
          _time: e.all_day ? 'Todo el día' : [e.start_time, e.end_time].filter(Boolean).join(' - ').slice(0, 13) || 'Sin horario',
        });
      }
    });
    return out;
  }, [events, month, year]);

  const firstOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = current.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const selectedDate = new Date(year, month, selected);
  const selectedEvents = dayEventsMap[selected] || [];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const typeCount = {};
  Object.values(dayEventsMap).flat().forEach(e => { typeCount[e._type] = (typeCount[e._type] || 0) + 1; });

  const userById = (id) => users.find(u => u.id === id);
  const projectById = (id) => projects.find(p => p.id === id);

  const handleDelete = async (e) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await calendarAPI.remove(e.id);
      addToast('Evento eliminado', 'success');
      setEvents(prev => prev.filter(x => x.id !== e.id));
    } catch {
      addToast('Error eliminando evento', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
            <FaCalendarAlt size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Calendario</h2>
            <p className="text-xs text-dark-400">{events.length} eventos · Entregas, reuniones, vencimientos y más</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-dark-700/50 rounded-xl p-1 border border-dark-600/40 text-xs">
            {['month','week','agenda'].map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 rounded-lg capitalize font-semibold transition', view===v ? 'bg-primary-600/30 text-primary-200 border border-primary-500/40' : 'text-dark-400 hover:text-white')}>{v}</button>
            ))}
          </div>
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={12}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar evento..." className="input-field !py-2 !pl-8 text-sm w-48"/></div>
          <button onClick={loadData} className="btn-secondary !px-3 !py-2 !text-sm" title="Refrescar"><FaSyncAlt size={12}/></button>
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12}/> Nuevo Evento</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 card hud-corner !p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-dark-600/50">
            <div className="flex items-center gap-2">
              <button onClick={prev} className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-300 hover:text-white flex items-center justify-center transition"><FaChevronLeft/></button>
              <h3 className="text-xl font-black heading-glow capitalize min-w-[220px] text-center">{monthName}</h3>
              <button onClick={next} className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-300 hover:text-white flex items-center justify-center transition"><FaChevronRight/></button>
            </div>
            <button onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today.getDate()); }} className="btn-secondary !px-3 !py-1.5 !text-xs">Hoy</button>
          </div>
          <div className="grid grid-cols-7 bg-dark-800/60 text-xs font-bold uppercase tracking-wider text-dark-400 text-center py-2.5">
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-px bg-dark-700/30">
            {loading && cells.slice(0,7).map((_,i) => <div key={`ld-${i}`} className="bg-dark-800/40 min-h-[120px] animate-pulse" />)}
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} className="bg-dark-800/40 min-h-[100px] md:min-h-[120px]" />;
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = d === selected;
              const rawList = dayEventsMap[d] || [];
              const dayEvents = (filter
                ? rawList.filter(e => String(e.title||'').toLowerCase().includes(filter.toLowerCase()))
                : rawList).slice(0, 3);
              const extra = (filter ? rawList.filter(e => String(e.title||'').toLowerCase().includes(filter.toLowerCase())) : rawList).length - dayEvents.length;
              return (
                <button
                  key={d} onClick={() => setSelected(d)}
                  className={cn(
                    'bg-dark-800/60 min-h-[100px] md:min-h-[120px] p-1.5 md:p-2 text-left hover:bg-dark-700/40 transition group',
                    isSelected && 'ring-2 ring-primary-500/60 bg-primary-500/5 z-10 relative',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'w-7 h-7 md:w-8 md:h-8 text-xs md:text-sm rounded-lg flex items-center justify-center font-bold transition',
                      isToday ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-glow-blue animate-pulse-slow'
                      : isSelected ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                      : 'text-dark-300 group-hover:text-white'
                    )}>{d}</span>
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.map(e => {
                      const Ic = e._Icon;
                      return (
                        <div key={e.id} className={cn('text-[10px] md:text-xs px-1.5 py-1 rounded-md border flex items-center gap-1 truncate', colorMap[e._color] || colorMap.primary)}>
                          <Ic size={8} className="flex-shrink-0" />
                          <span className="truncate">{e.title}</span>
                        </div>
                      );
                    })}
                    {extra > 0 && <div className="text-[10px] text-dark-400 px-1.5">+{extra} más</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card hud-corner">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-600/40">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white font-black shadow-glow-blue">
                {selected}
              </div>
              <div>
                <div className="text-xs text-dark-400 uppercase tracking-wider font-bold">Seleccionado</div>
                <div className="font-bold capitalize">{formatDate(selectedDate, 'full').split(',')[0]}</div>
                <div className="text-xs text-dark-500">{formatDate(selectedDate)}</div>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedEvents.length === 0 && <div className="text-center py-8 text-dark-500 text-sm"><FaCalendarAlt className="mx-auto mb-2 opacity-40" size={30}/>Sin eventos este día</div>}
              {selectedEvents.map(e => {
                const Ic = e._Icon;
                const us = (e.assigned_to_ids || []).map(id => userById(id)).filter(Boolean);
                const pr = e.project_id ? projectById(e.project_id) : null;
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className={cn('p-3 rounded-xl border', colorMap[e._color] || colorMap.primary)}>
                    <div className="flex items-start gap-2">
                      <Ic size={14} className="flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm">{e.title}</div>
                        <div className="text-[11px] mt-1 opacity-80 flex items-center gap-1"><FaRegClock size={9}/> {e._time}</div>
                        {pr && <div className="text-[11px] mt-1 opacity-80">📍 {pr.name}</div>}
                        {us.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {us.slice(0,3).map(u => <Avatar key={u.id} name={u.full_name} id={u.id} size="xs" />)}
                            {us.length > 3 && <span className="text-[10px] text-dark-500 ml-1">+{us.length - 3}</span>}
                          </div>
                        )}
                        {e.description && <div className="text-[11px] mt-2 opacity-70 border-t border-white/10 pt-2">{e.description}</div>}
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => handleDelete(e)} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 flex items-center gap-1"><FaTrash size={9} /> Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="card hud-corner">
            <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-dark-400">Categorías</h4>
            <div className="space-y-2">
              {Object.entries({
                entrega: 'Entregas Proyecto', reunion: 'Reuniones', tarea: 'Vencimientos Tareas',
                cumpleanos: 'Cumpleaños', vencimiento: 'Facturas', mantenimiento: 'Mantenimiento', pago: 'Pagos',
              }).map(([k, l]) => {
                const iconMap = { entrega: FaFlag, reunion: FaHandshake, tarea: FaCalendarCheck, cumpleanos: FaGift, vencimiento: FaRegClock, mantenimiento: FaFlask, pago: FaCalendarAlt };
                const Ic = iconMap[k] || FaCalendarAlt;
                return (
                  <div key={k} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-dark-700/40 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Ic size={11} className="text-primary-400" />
                      <span className="text-dark-200">{l}</span>
                    </div>
                    <span className="badge-info">{typeCount[k] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">Nuevo Evento</h3>
            <p className="text-xs text-dark-400 mb-5">Programa un evento en el calendario</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Título *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Título del evento" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Fecha *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Color</label>
                  <select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="input-field">
                    {defaultColors.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/40 border border-dark-600/40">
                <input type="checkbox" id="all_day" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                <label htmlFor="all_day" className="text-sm text-dark-200 font-medium cursor-pointer">Todo el día (sin horario)</label>
              </div>
              {!form.all_day && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Hora Inicio</label>
                    <input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Hora Fin</label>
                    <input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} className="input-field" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Proyecto Relacionado</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="input-field">
                    <option value="">Ninguno</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Asignados (IDs separados por coma)</label>
                  <input value={form.assigned_to_ids} onChange={e => setForm({ ...form, assigned_to_ids: e.target.value })} className="input-field" placeholder="Ej: 1, 3, 5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Detalles del evento..." />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Crear Evento'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
