import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaSearch, FaPlus, FaProjectDiagram, FaFilter, FaArrowRight,
  FaUserTie, FaCalendarAlt, FaDollarSign, FaDownload,
} from 'react-icons/fa';
import { projectsAPI } from '../lib/api';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';

const statuses = ['','pendiente','en_progreso','en_pruebas','finalizado','pausado','cancelado'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.list({ search: search || undefined, status: status || undefined, limit: 50 });
      setProjects(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, status]);

  const mock = [
    { id: 1, name: 'Robot Autónomo de Entrega', description: 'Robot para entregas urbanas con navegación GPS y visión artificial', budget_value: 25000000, actual_cost: 11250000, start_date: '2025-01-15', end_date: '2026-01-15', status: 'en_progreso', progress_percentage: 45, client_id: 1 },
    { id: 2, name: 'Sistema IoT Agrícola', description: 'Sensores IoT con dashboard de monitoreo para cultivos de precisión', budget_value: 15000000, actual_cost: 1500000, start_date: '2025-06-01', status: 'pendiente', progress_percentage: 10 },
    { id: 3, name: 'Brazo Robótico 6DOF Industrial', description: 'Brazo robot de 6 grados de libertad para línea de ensamblaje', budget_value: 45000000, actual_cost: 42000000, start_date: '2024-01-15', end_date: '2024-12-15', status: 'finalizado', progress_percentage: 100 },
    { id: 4, name: 'Plataforma de Detección de Defectos', description: 'IA con visión por computador para detección de fallos en línea de producción', budget_value: 32000000, actual_cost: 18000000, start_date: '2025-03-01', end_date: '2025-12-20', status: 'en_progreso', progress_percentage: 62 },
    { id: 5, name: 'Drone de Inspección Industrial', description: 'Dron autónomo para inspección de infraestructura con sensores térmicos', budget_value: 28000000, actual_cost: 7000000, start_date: '2025-05-01', end_date: '2026-02-28', status: 'en_progreso', progress_percentage: 25 },
    { id: 6, name: 'Cinta Transportadora Inteligente', description: 'Sistema automatizado de clasificación por peso y dimensiones', budget_value: 18000000, actual_cost: 18500000, start_date: '2024-06-01', end_date: '2024-12-01', status: 'finalizado', progress_percentage: 100 },
    { id: 7, name: 'Exoesqueleto de Rehabilitación', description: 'Exoesqueleto robótico para terapia física con monitoreo biométrico', budget_value: 60000000, actual_cost: 9000000, start_date: '2025-04-01', end_date: '2026-06-30', status: 'en_pruebas', progress_percentage: 78 },
    { id: 8, name: 'Vehículo AGV Logístico', description: 'Vehículo de guiado automático para almacenes y logística interna', budget_value: 22000000, actual_cost: 0, start_date: '2025-08-01', status: 'pausado', progress_percentage: 5 },
  ];
  const list = projects.length ? projects : mock;

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
            {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFilter size={12} /></button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12} /></button>
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={() => {}}><FaPlus size={12} /> Nuevo Proyecto</button>
        </div>
      </motion.div>

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
              <Link to={`/projects/${p.id}`} className="w-9 h-9 rounded-xl bg-dark-700/60 hover:bg-primary-600/30 hover:text-primary-300 flex items-center justify-center transition group-hover:translate-x-0.5">
                <FaArrowRight size={13} />
              </Link>
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
                <div className="font-mono font-bold text-neon-green text-xs">{formatCurrency(p.budget_value)}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
