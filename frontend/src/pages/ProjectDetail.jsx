import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaEdit, FaTrash, FaPlus, FaComment, FaPaperclip, FaFileAlt,
  FaUsers, FaTasks, FaDollarSign, FaCalendarAlt, FaFlask, FaDownload,
} from 'react-icons/fa';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';
import RoleGuard from '../components/ui/RoleGuard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BarChart, LineChart } from '../components/ui/Charts.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('general');

  const project = {
    id, name: 'Robot Autónomo de Entrega', description: 'Desarrollo de robot autónomo para entregas urbanas con navegación GPS, visión artificial y sistema de recarga automática.',
    budget_value: 25000000, actual_cost: 11250000, start_date: '2025-01-15', end_date: '2026-01-15',
    status: 'en_progreso', progress_percentage: 45, profit_margin: 15, client: { id: 1, full_name: 'TechCorp Solutions' },
    lab: { id: 1, name: 'Laboratorio de Robótica', status: 'operativo' },
    created_by: { id: 1, full_name: 'Admin RoboLab' },
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaFileAlt },
    { id: 'tasks', label: 'Tareas', icon: FaTasks },
    { id: 'team', label: 'Equipo', icon: FaUsers },
    { id: 'docs', label: 'Documentos', icon: FaPaperclip },
    { id: 'finance', label: 'Finanzas', icon: FaDollarSign },
  ];

  const tasks = project?.tasks || [];

  const team = [
    { name: 'Laura Martínez', role: 'Jefe de Proyecto', hours: 160 },
    { name: 'Carlos Vega', role: 'Programador Principal', hours: 140 },
    { name: 'Diana Torres', role: 'Ingeniero Electrónico', hours: 120 },
    { name: 'Esteban López', role: 'Diseñador CAD', hours: 80 },
    { name: 'Fernanda Gómez', role: 'Técnico', hours: 60 },
  ];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
        <Link to="/projects" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-primary-500/15 text-dark-300 hover:text-primary-300 transition">
          <FaArrowLeft size={15} />
        </Link>
        <div className="min-w-0">
          <div className="text-[11px] text-dark-500 uppercase tracking-wider">Proyecto #{String(id).padStart(4,'0')}</div>
          <h2 className="text-2xl font-black heading-glow truncate">{project.name}</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin() && <button className="btn-secondary !px-3 !py-2 !text-sm"><FaEdit size={12} /> Editar</button>}
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaDownload size={12} /> Reporte</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: 'Progreso', v: `${project.progress_percentage}%`, c: 'primary', s: '45%' },
          { l: 'Presupuesto', v: formatCurrency(project.budget_value), c: 'green', s: '100%' },
          { l: 'Ejecutado', v: formatCurrency(project.actual_cost), c: 'cyan', s: `${(project.actual_cost/project.budget_value*100).toFixed(0)}%` },
          { l: 'Margen', v: `${project.profit_margin}%`, c: 'purple', s: '30%' },
        ].map((k, i) => {
          const col = { primary:'from-primary-600 to-primary-500', green:'from-emerald-600 to-neon-green', cyan:'from-cyan-600 to-neon-blue', purple:'from-purple-600 to-neon-purple' }[k.c];
          return (
            <motion.div key={k.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.08 }} className="card hud-corner !p-4">
              <div className="text-xs text-dark-400 uppercase tracking-wider">{k.l}</div>
              <div className="text-2xl font-black heading-glow my-1">{k.v}</div>
              <div className="progress-bar mt-2">
                <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', col)} style={{ width: k.s }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card hud-corner !p-0 overflow-hidden">
        <div className="border-b border-dark-600/60 flex flex-wrap items-center gap-1 p-2">
          {tabs.map(t => {
            const Ic = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id} onClick={() => setTab(t.id)}
                className={cn('px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition',
                  active ? 'bg-primary-600/25 text-primary-200 border border-primary-500/40 shadow-glow-blue' : 'text-dark-400 hover:text-white hover:bg-dark-700/60'
                )}
              >
                <Ic size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-dark-400 mb-3">Descripción del Proyecto</h4>
                  <div className="glass rounded-xl p-4 text-sm leading-relaxed text-dark-200">
                    {project.description}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-dark-400 mb-3">Cronograma de Avance</h4>
                  <div className="glass rounded-xl p-4">
                    <LineChart
                      labels={['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago']}
                      datasets={[{ label: 'Planificado', data: [5,15,25,35,45,55,65,75], borderColor: '#a855f7' },{ label: 'Real', data: [5,12,20,28,36,42,44,45], borderColor: '#00ff88' }]}
                      className="h-52"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <InfoRow icon={FaUsers} label="Cliente" value={project.client.full_name} />
                <InfoRow icon={FaFlask} label="Laboratorio" value={project.lab.name} badge={project.lab.status} />
                <InfoRow icon={FaCalendarAlt} label="Inicio" value={formatDate(project.start_date)} />
                <InfoRow icon={FaCalendarAlt} label="Entrega" value={formatDate(project.end_date)} />
                <InfoRow icon={FaUsers} label="Responsable" value={project.created_by.full_name} />
                <div className="glass rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wider text-dark-400 font-bold mb-3">Estado</div>
                  <span className={`${getStatusBadge(project.status)} !text-sm !px-3 !py-1.5`}>{String(project.status).replace(/_/g,' ')}</span>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wider text-dark-400 font-bold mb-3">Gastos por categoría</div>
                  <BarChart labels={['HW','SW','Pers','Mat','Serv']} datasets={[{ label: 'COP', data: [3.2,2.5,3,1.8,0.75] }]} className="h-40" />
                </div>
              </div>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-dark-400">{tasks.length} tareas registradas</div>
                <button className="btn-primary !px-3 !py-1.5 !text-xs"><FaPlus size={11} /> Nueva Tarea</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-dark-500 border-b border-dark-700">
                    <tr>
                      <th className="text-left py-2 px-2">Tarea</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Responsable</th>
                      <th className="text-left py-2 px-2">Prioridad</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Vence</th>
                      <th className="text-left py-2 px-2">Progreso</th>
                      <th className="text-left py-2 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id} className="border-b border-dark-700/40 hover:bg-dark-700/30">
                        <td className="py-3 px-2 font-medium">{t.title}</td>
                        <td className="py-3 px-2 hidden sm:table-cell">
                          <div className="flex items-center gap-2"><Avatar size="xs" name={t.assigned_to?.full_name || 'Sin Asignar'} id={t.assigned_to_id || t.id} />{t.assigned_to?.full_name || 'Sin Asignar'}</div>
                        </td>
                        <td className="py-3 px-2"><span className={getStatusBadge(t.priority)}>{t.priority}</span></td>
                        <td className="py-3 px-2 text-xs text-dark-400 hidden md:table-cell">{formatDate(t.due)}</td>
                        <td className="py-3 px-2 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div>
                            <span className="text-xs font-mono w-9 text-right">{t.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2"><span className={getStatusBadge(t.status)}>{t.status.replace(/_/g,' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((m, i) => (
                <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }} className="glass rounded-xl p-4 hover:border-primary-500/40 transition flex items-center gap-3">
                  <Avatar name={m.name} id={i} size="lg" online />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{m.name}</div>
                    <div className="text-xs text-dark-400">{m.role}</div>
                    <div className="mt-2 text-xs"><span className="text-dark-500">Horas: </span><span className="font-mono font-bold text-neon-green">{m.hours}h</span></div>
                  </div>
                </motion.div>
              ))}
              <RoleGuard adminOnly>
                <button className="glass rounded-xl p-4 hover:border-neon-green/40 text-dark-500 hover:text-neon-green transition flex items-center justify-center gap-2 border-dashed border-2">
                  <FaPlus size={14} /> Agregar integrante
                </button>
              </RoleGuard>
            </div>
          )}

          {tab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { n: 'Especificaciones_Tecnicas.pdf', t: 'PDF', s: '2.4 MB', d: '2025-01-10' },
                { n: 'Planos_Chasis_V2.dwg', t: 'DWG', s: '8.1 MB', d: '2025-02-15' },
                { n: 'Modelo_3D_Robot.f3d', t: '3D', s: '54.2 MB', d: '2025-03-05' },
                { n: 'Lista_Materiales.xlsx', t: 'XLSX', s: '128 KB', d: '2025-01-20' },
                { n: 'Cronograma_Gantt.mpp', t: 'MPP', s: '3.1 MB', d: '2025-01-15' },
                { n: 'Riesgos_y_Mitigacion.docx', t: 'DOCX', s: '256 KB', d: '2025-02-01' },
                { n: 'Presupuesto_Detallado.xlsx', t: 'XLSX', s: '512 KB', d: '2025-01-12' },
                { n: 'Acta_Reunion_003.pdf', t: 'PDF', s: '890 KB', d: '2025-06-18' },
              ].map((f, i) => (
                <motion.div key={f.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.03 }} className="glass rounded-xl p-4 hover:border-primary-500/40 transition cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg uppercase',
                      f.t==='PDF'?'bg-red-500/15 text-red-400 border border-red-500/30':
                      f.t==='3D'?'bg-neon-purple/15 text-neon-purple border border-neon-purple/30':
                      f.t==='XLSX'?'bg-neon-green/15 text-neon-green border border-neon-green/30':
                      f.t==='DWG'?'bg-primary-500/15 text-primary-300 border border-primary-500/30':
                      'bg-dark-600/60 text-dark-300 border border-dark-500/40'
                    )}>{f.t}</span>
                    <FaDownload size={12} className="text-dark-500 group-hover:text-primary-400 transition" />
                  </div>
                  <div className="font-semibold text-sm truncate">{f.n}</div>
                  <div className="text-xs text-dark-500 mt-2 flex items-center justify-between">
                    <span>{f.s}</span>
                    <span>{formatDate(f.d)}</span>
                  </div>
                </motion.div>
              ))}
              <RoleGuard adminOnly>
                <button className="glass rounded-xl p-4 hover:border-neon-green/40 text-dark-500 hover:text-neon-green transition flex flex-col items-center justify-center gap-2 border-dashed border-2 min-h-[140px]">
                  <FaPlus size={20} /> Subir archivo
                </button>
              </RoleGuard>
            </div>
          )}

          {tab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-5">
                <div className="font-bold mb-2">Ejecución Presupuestal</div>
                <div className="text-xs text-dark-400 mb-4">Presupuesto vs ejecución real</div>
                <BarChart labels={['HW','Software','Personal','Materiales','Servicios','Contingencia']} datasets={[
                  { label: 'Presupuesto', data: [6,4,7,3,2,3] },
                  { label: 'Ejecutado', data: [4.5,3,2.8,0.9,0,0] },
                ]} className="h-64" />
              </div>
              <div className="space-y-3">
                <div className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-dark-500 uppercase tracking-wider">Total Presupuesto</div>
                    <div className="text-2xl font-black heading-glow">{formatCurrency(project.budget_value)}</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center"><FaDollarSign className="text-primary-400" /></div>
                </div>
                <div className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-dark-500 uppercase tracking-wider">Total Ejecutado</div>
                    <div className="text-2xl font-black text-neon-blue">{formatCurrency(project.actual_cost)}</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center"><FaDollarSign className="text-neon-blue" /></div>
                </div>
                <div className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-dark-500 uppercase tracking-wider">Por Ejecutar</div>
                    <div className="text-2xl font-black text-neon-yellow">{formatCurrency(project.budget_value - project.actual_cost)}</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-neon-yellow/15 border border-neon-yellow/30 flex items-center justify-center"><FaDollarSign className="text-neon-yellow" /></div>
                </div>
                <div className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-dark-500 uppercase tracking-wider">Margen Proyectado</div>
                    <div className="text-2xl font-black text-neon-green">+{project.profit_margin}%</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center"><FaDollarSign className="text-neon-green" /></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Ic, label, value, badge }) {
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-dark-700/60 flex items-center justify-center text-primary-400 flex-shrink-0">
        <Ic size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-dark-500 font-bold">{label}</div>
        <div className="font-semibold text-sm truncate flex items-center gap-2">
          {value}
          {badge && <span className={getStatusBadge(badge)}>{badge}</span>}
        </div>
      </div>
    </div>
  );
}
