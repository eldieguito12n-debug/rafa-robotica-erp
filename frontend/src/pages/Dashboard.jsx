import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FaProjectDiagram, FaCheckCircle, FaUsers, FaTasks, FaClock,
  FaDollarSign, FaArrowUp, FaArrowDown, FaUserPlus, FaFlask,
  FaCalendarAlt, FaBoxes, FaChartLine, FaHistory, FaCaretUp, FaCaretDown,
} from 'react-icons/fa';
import KPICard from '../components/ui/KPICard.jsx';
import { LineChart, BarChart, DoughnutChart } from '../components/ui/Charts.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { dashboardAPI, projectsAPI, tasksAPI, inventoryAPI, labsAPI, usersAPI } from '../lib/api';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { cn, formatCurrency, formatDate, formatNumber, getStatusBadge, timeAgo } from '../lib/utils';
import { getStatusBadge as getSB } from '../lib/utils';

export default function Dashboard() {
  const { addToast } = useAppData();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invAlerts, setInvAlerts] = useState(null);
  const [period, setPeriod] = useState('month');
  const [salesChart, setSalesChart] = useState(null);
  const [projectsChart, setProjectsChart] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, t, a] = await Promise.all([
          dashboardAPI.stats(),
          projectsAPI.list({ limit: 5 }),
          tasksAPI.list({ limit: 6 }),
          inventoryAPI.alerts().catch(() => ({ data: { items: [] } })),
        ]);
        setStats(s.data);
        setProjects(p.data);
        setTasks(t.data);
        setInvAlerts(a.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          dashboardAPI.chartData('sales', period),
          dashboardAPI.chartData('projects', period),
        ]);
        setSalesChart(s.data);
        setProjectsChart(p.data);
      } catch {}
    })();
  }, [period]);

  const kpis = useMemo(() => stats ? [
    { title: 'Proyectos Activos', value: stats.active_projects, icon: FaProjectDiagram, color: 'primary', trend: true, trendValue: '+18%', subtitle: 'vs mes anterior' },
    { title: 'Proyectos Terminados', value: stats.completed_projects, icon: FaCheckCircle, color: 'green', trend: true, trendValue: '+24%', subtitle: 'Exitoso' },
    { title: 'Desarrolladores', value: stats.connected_developers, icon: FaUsers, color: 'cyan', trend: true, trendValue: '+5', subtitle: 'Equipo conectado' },
    { title: 'Tareas Pendientes', value: stats.pending_tasks, icon: FaTasks, color: 'purple', trend: false, trendValue: '-3%', subtitle: 'En seguimiento' },
    { title: 'Horas Trabajadas', value: Math.round(stats.hours_worked), icon: FaClock, color: 'yellow', trend: true, trendValue: '+15%', subtitle: 'Este mes' },
    { title: 'Ventas del Mes', value: stats.monthly_sales, icon: FaDollarSign, color: 'green', trend: true, trendValue: '+32%', subtitle: 'Objetivo 78%', currency: true },
    { title: 'Gastos del Mes', value: stats.monthly_expenses, icon: FaArrowDown, color: 'red', trend: false, trendValue: '-8%', subtitle: 'Ahorro detectado', currency: true },
    { title: 'Utilidad Neta', value: stats.monthly_profit, icon: FaChartLine, color: 'primary', trend: true, trendValue: '+41%', subtitle: 'Margen saludable', currency: true },
  ] : [], [stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-36 glass rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card !p-6 relative overflow-hidden bg-gradient-to-br from-dark-800 via-dark-800 to-primary-900/30"
      >
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-neon-green/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <Avatar name={user?.full_name} id={user?.id} size="xl" online />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
                {formatDate(now, 'full')}
              </div>
              <h2 className="text-2xl md:text-3xl font-black heading-glow">
                {greeting}, {user?.full_name?.split(' ')[0]} 👋
              </h2>
              <p className="text-sm text-dark-300 mt-1">
                Hoy tienes{' '}
                <span className="text-neon-green font-bold">{stats?.pending_tasks || 0}</span> tareas pendientes y{' '}
                <span className="text-primary-400 font-bold">{stats?.active_projects || 0}</span> proyectos en marcha.
              </p>
            </div>
          </div>
          <div className="flex-1 md:max-w-md md:ml-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-dark-400">Cumplimiento</div>
                <div className="text-xl font-black text-neon-green neon-text mt-1">{stats?.kpis?.project_completion_rate || 0}%</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-dark-400">Inventario</div>
                <div className="text-xl font-black text-neon-blue mt-1">{formatCurrency(stats?.kpis?.inventory_value || 0)}</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-dark-400">Margen</div>
                <div className="text-xl font-black text-primary-400 mt-1">{stats?.kpis?.profit_margin || 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KPICard key={k.title} {...k} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="card lg:col-span-2 hud-corner"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaChartLine className="text-primary-400" />
                Ingresos vs Egresos
              </h3>
              <p className="text-xs text-dark-400">Análisis financiero del periodo</p>
            </div>
            <div className="flex gap-1 p-1 bg-dark-700/50 rounded-xl text-xs">
              {['week', 'month', 'year'].map(p => (
                <button
                  key={p} onClick={() => setPeriod(p)}
                  className={cn('px-3 py-1.5 rounded-lg font-semibold capitalize transition',
                    period === p ? 'bg-primary-600/30 text-primary-300 border border-primary-500/40' : 'text-dark-400 hover:text-white')}
                >{p}</button>
              ))}
            </div>
          </div>
          {salesChart && (
            <LineChart
              labels={salesChart.labels}
              datasets={[
                { label: 'Ingresos', data: salesChart.datasets[0].data, borderColor: '#00ff88' },
                { label: 'Egresos', data: salesChart.datasets[1].data, borderColor: '#ff5577' },
              ]}
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="card hud-corner"
        >
          <div className="mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FaProjectDiagram className="text-neon-purple" />
              Distribución de Proyectos
            </h3>
            <p className="text-xs text-dark-400">Por estado actual</p>
          </div>
          <DoughnutChart
            labels={['Activos', 'Completados', 'En pruebas', 'Pausados']}
            data={[
              stats?.active_projects || 0,
              stats?.completed_projects || 0,
              Math.round((stats?.active_projects || 0) * 0.3),
              Math.max(0, Math.round((stats?.active_projects || 0) * 0.15)),
            ]}
            className="h-60"
          />
        </motion.div>
      </div>

      {/* Row: Projects + Inventory Alerts + Labs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card lg:col-span-2 hud-corner"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaProjectDiagram className="text-primary-400" />
                Proyectos Recientes
              </h3>
              <p className="text-xs text-dark-400">Estado y progreso</p>
            </div>
            <span className="text-xs badge-info">Total: {projects.length}</span>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-dark-500 border-b border-dark-700">
                  <th className="text-left py-3 px-2">Proyecto</th>
                  <th className="text-left py-3 px-2">Estado</th>
                  <th className="text-left py-3 px-2">Progreso</th>
                  <th className="text-right py-3 px-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-dark-500">Sin proyectos aún</td></tr>
                )}
                {projects.map(p => {
                  const status = String(p.status || '').toLowerCase();
                  return (
                    <tr key={p.id} className="border-b border-dark-700/40 hover:bg-dark-700/30 transition">
                      <td className="py-3 px-2">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[11px] text-dark-500">
                          Entrega: {formatDate(p.end_date) || 'Sin fecha'}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={getStatusBadge(p.status)}>{status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-2 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="progress-bar flex-1">
                            <div className="progress-fill" style={{ width: `${p.progress_percentage || 0}%` }} />
                          </div>
                          <span className="text-xs font-mono text-dark-300 w-10 text-right">{p.progress_percentage || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-neon-green text-xs">{formatCurrency(p.budget_value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card hud-corner flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaBoxes className="text-neon-yellow" />
                Alertas Inventario
              </h3>
              <p className="text-xs text-dark-400">Stock bajo</p>
            </div>
            {invAlerts && invAlerts.total_alerts > 0 && (
              <span className="badge-danger">{invAlerts.total_alerts}</span>
            )}
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-80">
            {(invAlerts?.items || []).length === 0 && (
              <div className="text-center py-8 text-dark-500 text-sm">
                <FaCheckCircle size={30} className="mx-auto mb-2 opacity-50 text-neon-green" />
                ¡Inventario óptimo!
              </div>
            )}
            {(invAlerts?.items || []).map(it => (
              <div key={it.id} className="p-3 rounded-xl bg-dark-700/40 hover:bg-dark-700/60 transition border border-dark-600/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{it.name}</div>
                    <div className="text-[11px] text-dark-500">SKU: {it.sku || 'N/A'}</div>
                  </div>
                  <span className="badge-danger text-[10px]">{String(it.category).toUpperCase()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <FaCaretDown className="text-red-400" />
                    <span className="font-mono text-red-400 font-semibold">{it.quantity} uds</span>
                    <span className="text-dark-500">/ min {it.min_stock}</span>
                  </div>
                  <button className="text-[11px] text-primary-400 hover:text-primary-300 font-semibold">
                    Ordenar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row: Labs + Tasks + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card hud-corner"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaFlask className="text-neon-green" />
                Estado Laboratorios
              </h3>
              <p className="text-xs text-dark-400">Uso en tiempo real</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {(stats?.labs || []).map(lab => {
              const st = String(lab.status || 'disponible').toLowerCase();
              return (
                <div key={lab.id} className="p-3 rounded-xl bg-dark-700/30 border border-dark-600/40 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700/50 to-dark-700 flex items-center justify-center flex-shrink-0">
                    <FaFlask size={16} className="text-primary-300" />
                    <span className={cn(
                      'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800',
                      st === 'operativo' || st === 'disponible' ? 'bg-neon-green' :
                      st === 'mantenimiento' ? 'bg-neon-yellow animate-pulse' :
                      st === 'ocupado' ? 'bg-primary-500' : 'bg-dark-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{lab.name}</div>
                    <div className="text-[11px] text-dark-500 truncate">{lab.location || lab.code}</div>
                  </div>
                  <span className={getStatusBadge(lab.status)}>{st}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card hud-corner"
        >
          <div className="mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FaTasks className="text-neon-purple" />
              Tareas Prioritarias
            </h3>
            <p className="text-xs text-dark-400">Asignadas recientemente</p>
          </div>
          <div className="space-y-2.5">
            {tasks.map(t => (
              <div key={t.id} className="p-3 rounded-xl bg-dark-700/30 border border-dark-600/40 hover:border-primary-500/30 transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-sm line-clamp-1 flex-1">{t.title}</div>
                  <span className={`${getStatusBadge(t.priority)} !text-[10px] shrink-0`}>
                    {String(t.priority || '').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-400 mb-2">
                  <span className={getStatusBadge(t.status)}>{String(t.status || '').replace(/_/g, ' ')}</span>
                  {t.due_date && (
                    <span className="font-mono text-[10px]">{formatDate(t.due_date, 'short')}</span>
                  )}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${t.progress_percentage || 0}%` }} />
                </div>
              </div>
            ))}
            {tasks.length === 0 && <div className="text-center py-8 text-dark-500 text-sm">Sin tareas</div>}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card hud-corner"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaHistory className="text-neon-blue" />
                Actividad Reciente
              </h3>
              <p className="text-xs text-dark-400">Timeline del sistema</p>
            </div>
          </div>
          <div className="relative pl-5 space-y-4">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-primary-500 via-neon-green to-transparent" />
            {(stats?.recent_activity || []).slice(0, 6).map((act, i) => (
              <div key={act.id || i} className="relative">
                <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-dark-800 bg-gradient-to-br from-primary-500 to-neon-green" />
                <div className="text-xs text-dark-500">{act.user} · {timeAgo(act.time)}</div>
                <div className="text-sm font-medium text-dark-100">{act.action}</div>
                {act.entity_type && (
                  <div className="text-[11px] text-dark-400">{act.entity_type} #{act.entity_id}</div>
                )}
              </div>
            ))}
            {(stats?.recent_activity || []).length === 0 && (
              <div className="text-center py-4 text-dark-500 text-xs">Sin actividad</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row: Projects chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card hud-corner"
        >
          <div className="mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FaChartLine className="text-neon-green" />
              Creación de Proyectos
            </h3>
            <p className="text-xs text-dark-400">Histórico por periodo</p>
          </div>
          {projectsChart && (
            <BarChart
              labels={projectsChart.labels}
              datasets={[{ label: 'Proyectos', data: projectsChart.datasets[0].data }]}
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card hud-corner relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaCalendarAlt className="text-neon-blue" />
                Calendario Rápido
              </h3>
              <p className="text-xs text-dark-400">Resumen del mes</p>
            </div>
            <div className="badge-primary">
              {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <MiniCalendar />
        </motion.div>
      </div>
    </div>
  );
}

function MiniCalendar() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const startDay = first.getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = now.getDate();
  const highlights = { [today]: 'today', 3: 'meet', 8: 'deliver', 14: 'meet', 20: 'deliver', 25: 'pay' };
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-dark-500 mb-2 uppercase">
        {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(d => {
          const t = highlights[d];
          return (
            <div
              key={d}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition cursor-pointer relative',
                t === 'today'
                  ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-glow-blue'
                  : t === 'deliver'
                  ? 'bg-neon-green/15 text-neon-green border border-neon-green/40'
                  : t === 'meet'
                  ? 'bg-primary-500/15 text-primary-300 border border-primary-500/40'
                  : t === 'pay'
                  ? 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/40'
                  : 'hover:bg-dark-700/60 text-dark-300 hover:text-white'
              )}
            >
              {d}
              {t && t !== 'today' && (
                <span className={cn(
                  'absolute -bottom-0.5 w-1 h-1 rounded-full',
                  t === 'deliver' ? 'bg-neon-green' : t === 'meet' ? 'bg-primary-400' : 'bg-neon-yellow'
                )} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-dark-600/40 flex flex-wrap gap-3 text-[11px]">
        <Legend color="bg-gradient-to-br from-primary-600 to-primary-500" label="Hoy" />
        <Legend color="bg-neon-green" label="Entregas" />
        <Legend color="bg-primary-400" label="Reuniones" />
        <Legend color="bg-neon-yellow" label="Pagos" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 text-dark-400">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
