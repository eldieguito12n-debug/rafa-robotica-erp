import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaColumns, FaPlus, FaSearch, FaEllipsisV, FaCalendar, FaFlag } from 'react-icons/fa';
import { cn, formatDate, getStatusBadge } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';

const initial = {
  pendiente: [
    { id: 1, title: 'Diseñar PCB controladora', priority: 'media', due: '2025-08-09', dev: 'Diana Torres', project: 'Robot Entrega' },
    { id: 2, title: 'Listado de materiales PCB', priority: 'baja', due: '2025-08-10', dev: 'Fernanda Gómez', project: 'Robot Entrega' },
    { id: 5, title: 'Reunión kickoff drone inspección', priority: 'media', due: '2025-07-30', dev: 'Laura Martínez', project: 'Drone Inspección' },
  ],
  en_proceso: [
    { id: 3, title: 'Integrar sensor LIDAR v2', priority: 'urgente', due: '2025-08-05', dev: 'Diana Torres', project: 'Robot Entrega' },
    { id: 4, title: 'Algoritmo navegación SLAM', priority: 'alta', due: '2025-08-12', dev: 'Carlos Vega', project: 'Robot Entrega' },
    { id: 6, title: 'Modelo 3D chasis refinado', priority: 'media', due: '2025-08-02', dev: 'Esteban López', project: 'Robot Entrega' },
  ],
  en_pruebas: [
    { id: 7, title: 'Tests de torque motores', priority: 'alta', due: '2025-08-01', dev: 'Fernanda Gómez', project: 'Brazo 6DOF' },
    { id: 8, title: 'Validación de seguridad', priority: 'urgente', due: '2025-07-28', dev: 'Laura Martínez', project: 'Exoesqueleto' },
  ],
  finalizado: [
    { id: 9, title: 'Diseño inicial chasis v1', priority: 'alta', due: '2025-02-10', dev: 'Esteban López', project: 'Robot Entrega' },
    { id: 10, title: 'Selección proveedores motores', priority: 'media', due: '2025-01-20', dev: 'Diana Torres', project: 'Brazo 6DOF' },
  ],
  entregado: [
    { id: 11, title: 'Especificaciones iniciales', priority: 'alta', due: '2024-12-20', dev: 'Laura Martínez', project: 'Brazo 6DOF' },
  ],
};

const columns = [
  { id: 'pendiente', label: 'Pendiente', color: 'from-neon-yellow/20 to-neon-yellow/5', bar: 'bg-neon-yellow' },
  { id: 'en_proceso', label: 'En Desarrollo', color: 'from-primary-500/20 to-primary-500/5', bar: 'bg-primary-500' },
  { id: 'en_pruebas', label: 'Pruebas', color: 'from-neon-purple/20 to-neon-purple/5', bar: 'bg-neon-purple' },
  { id: 'finalizado', label: 'Listo', color: 'from-neon-blue/20 to-neon-blue/5', bar: 'bg-neon-blue' },
  { id: 'entregado', label: 'Entregado', color: 'from-neon-green/20 to-neon-green/5', bar: 'bg-neon-green' },
];

export default function Kanban() {
  const [cols, setCols] = useState(initial);
  const [dragging, setDragging] = useState(null);
  const [filter, setFilter] = useState('');

  const onDragStart = (e, col, id) => {
    setDragging({ from: col, id });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e, toCol) => {
    if (!dragging || dragging.from === toCol) return;
    setCols(prev => {
      const card = prev[dragging.from].find(c => c.id === dragging.id);
      if (!card) return prev;
      return {
        ...prev,
        [dragging.from]: prev[dragging.from].filter(c => c.id !== dragging.id),
        [toCol]: [...prev[toCol], card],
      };
    });
    setDragging(null);
  };

  const filtered = (list) => !filter ? list : list.filter(c =>
    c.title.toLowerCase().includes(filter.toLowerCase()) ||
    c.dev.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-5 h-[calc(100vh-180px)] flex flex-col min-h-[600px]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
            <FaColumns size={22} className="text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Tablero Kanban</h2>
            <p className="text-xs text-dark-400">Arrastra tareas entre columnas · Actualización en tiempo real</p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar tareas..." className="input-field !py-2 !pl-8 text-sm w-56" />
          </div>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12} /> Nueva Tarea</button>
        </div>
      </motion.div>

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
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary-300 transition">{c.title}</h4>
                        <span className={`${getStatusBadge(c.priority)} !text-[10px] shrink-0`}>{c.priority.toUpperCase()}</span>
                      </div>
                      <div className="text-[11px] px-2 py-0.5 rounded-md bg-dark-700/70 text-dark-300 inline-flex items-center gap-1 mb-3">
                        <FaFlag size={8} className="text-dark-500" /> {c.project}
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-dark-600/40 pt-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="xs" name={c.dev} id={c.id} />
                          <span className="text-dark-300">{c.dev.split(' ')[0]}</span>
                        </div>
                        <div className={cn('flex items-center gap-1', new Date(c.due) < new Date() ? 'text-red-400' : 'text-dark-500')}>
                          <FaCalendar size={9} />
                          <span className="font-mono text-[10px]">{formatDate(c.due, 'short')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <button className="w-full py-2.5 rounded-xl border border-dashed border-dark-600/60 text-dark-500 hover:text-primary-300 hover:border-primary-500/40 hover:bg-primary-500/5 transition text-xs font-semibold flex items-center justify-center gap-1.5">
                    <FaPlus size={10} /> Agregar tarjeta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
