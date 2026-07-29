import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaSearch, FaCalendarCheck,
  FaGift, FaFlag, FaFlask, FaHandshake, FaUserFriends, FaRegClock,
} from 'react-icons/fa';
import { cn, formatDate } from '../lib/utils';

const initialEvents = [
  { id: 1, title: 'Entrega Robot Autónomo - Fase 1', date: null, day: 5, type: 'entrega', color: 'neon-green', time: '09:00' },
  { id: 2, title: 'Reunión Comité Técnico', date: null, day: 8, type: 'reunion', color: 'primary', time: '14:00' },
  { id: 3, title: 'Tarea: Integrar LIDAR vence', date: null, day: 8, type: 'tarea', color: 'neon-yellow', time: '18:00' },
  { id: 4, title: 'Cumpleaños Carlos Vega', date: null, day: 12, type: 'cumpleanos', color: 'neon-purple', time: 'Todo el día' },
  { id: 5, title: 'Vencimiento Factura #015', date: null, day: 15, type: 'vencimiento', color: 'red', time: '23:59' },
  { id: 6, title: 'Mantenimiento Laboratorio', date: null, day: 18, type: 'mantenimiento', color: 'neon-yellow', time: '08:00 - 12:00' },
  { id: 7, title: 'Visita Cliente - TechCorp', date: null, day: 22, type: 'reunion', color: 'primary', time: '10:00' },
  { id: 8, title: 'Auditoría Inventario', date: null, day: 25, type: 'tarea', color: 'neon-blue', time: '09:00' },
  { id: 9, title: 'Pago Nómina', date: null, day: 28, type: 'pago', color: 'neon-green', time: '16:00' },
  { id: 10, title: 'Demo Brazo Robótico Cliente', date: null, day: 30, type: 'entrega', color: 'neon-purple', time: '15:00' },
];

const eventIcons = {
  entrega: FaFlag, reunion: FaHandshake, tarea: FaCalendarCheck,
  cumpleanos: FaGift, vencimiento: FaRegClock, mantenimiento: FaFlask,
  pago: FaCalendarAlt,
};

export default function Calendar() {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const [view, setView] = useState('month'); // month | week | agenda
  const [filter, setFilter] = useState('');

  const month = current.getMonth();
  const year = current.getFullYear();
  const firstOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const events = useMemo(() => initialEvents.filter(e =>
    !filter || e.title.toLowerCase().includes(filter.toLowerCase())
  ), [filter]);

  const monthName = current.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const selectedDate = new Date(year, month, selected);
  const selectedEvents = events.filter(e => e.day === selected);

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const colorMap = {
    'neon-green': 'bg-neon-green/15 text-neon-green border-neon-green/40',
    'primary': 'bg-primary-500/15 text-primary-300 border-primary-500/40',
    'neon-yellow': 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/40',
    'neon-purple': 'bg-neon-purple/15 text-neon-purple border-neon-purple/40',
    'neon-blue': 'bg-neon-blue/15 text-neon-blue border-neon-blue/40',
    'red': 'bg-red-500/15 text-red-400 border-red-500/40',
  };

  const typeCount = {};
  events.forEach(e => { typeCount[e.type] = (typeCount[e.type] || 0) + 1; });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
            <FaCalendarAlt size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Calendario</h2>
            <p className="text-xs text-dark-400">Entregas, reuniones, tareas, vencimientos y más</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-dark-700/50 rounded-xl p-1 border border-dark-600/40 text-xs">
            {['month','week','agenda'].map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 rounded-lg capitalize font-semibold transition', view===v ? 'bg-primary-600/30 text-primary-200 border border-primary-500/40' : 'text-dark-400 hover:text-white')}>{v}</button>
            ))}
          </div>
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={12}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar evento..." className="input-field !py-2 !pl-8 text-sm w-48"/></div>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12}/> Nuevo Evento</button>
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
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} className="bg-dark-800/40 min-h-[100px] md:min-h-[120px]" />;
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = d === selected;
              const dayEvents = events.filter(e => e.day === d).slice(0, 3);
              const extra = events.filter(e => e.day === d).length - dayEvents.length;
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
                      const Ic = eventIcons[e.type] || FaCalendarAlt;
                      return (
                        <div key={e.id} className={cn('text-[10px] md:text-xs px-1.5 py-1 rounded-md border flex items-center gap-1 truncate', colorMap[e.color] || colorMap.primary)}>
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
              {selectedEvents.length === 0 && <div className="text-center py-8 text-dark-500 text-sm"><FaCalendarAlt className="mx-auto mb-2 opacity-40" size={30}/>Sin eventos</div>}
              {selectedEvents.map(e => {
                const Ic = eventIcons[e.type] || FaCalendarAlt;
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className={cn('p-3 rounded-xl border', colorMap[e.color] || colorMap.primary)}>
                    <div className="flex items-start gap-2">
                      <Ic size={14} className="flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm">{e.title}</div>
                        <div className="text-[11px] mt-1 opacity-80 flex items-center gap-1"><FaRegClock size={9}/> {e.time}</div>
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
              }).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-dark-700/40 cursor-pointer">
                  <div className="flex items-center gap-2">
                    {(() => { const Ic = eventIcons[k] || FaCalendarAlt; return <Ic size={11} className="text-primary-400" />; })()}
                    <span className="text-dark-200">{l}</span>
                  </div>
                  <span className="badge-info">{typeCount[k] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
