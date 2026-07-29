import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaChartBar, FaDownload, FaCalendarAlt, FaFilePdf, FaFileExcel,
  FaRobot, FaBoxes, FaDollarSign, FaUsers, FaTasks, FaProjectDiagram,
  FaClock, FaChartLine, FaChartPie, FaLightbulb, FaPrint,
} from 'react-icons/fa';
import { LineChart, BarChart, DoughnutChart } from '../components/ui/Charts.jsx';
import { cn, formatCurrency, formatNumber } from '../lib/utils';

const reports = [
  { id: 'productividad', title: 'Reporte de Productividad', desc: 'Horas trabajadas, cumplimiento y rendimiento por desarrollador', icon: FaChartLine, color: 'primary', period: 'Mensual' },
  { id: 'ventas', title: 'Reporte de Ventas', desc: 'Ingresos, egresos, utilidad y comparativo histórico', icon: FaDollarSign, color: 'green', period: 'Mensual' },
  { id: 'inventario', title: 'Reporte de Inventario', desc: 'Valor de stock, rotación, alertas y consumo', icon: FaBoxes, color: 'cyan', period: 'Semanal' },
  { id: 'proyectos', title: 'Reporte de Proyectos', desc: 'Avance, cumplimiento, presupuesto y estado', icon: FaProjectDiagram, color: 'purple', period: 'Quincenal' },
  { id: 'clientes', title: 'Reporte de Clientes', desc: 'Cartera, compras, saldos y comportamiento', icon: FaUsers, color: 'yellow', period: 'Trimestral' },
  { id: 'tareas', title: 'Reporte de Tareas', desc: 'Asignación, cumplimiento y tiempos', icon: FaTasks, color: 'primary', period: 'Semanal' },
];

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const [genLoading, setGenLoading] = useState('');

  const generate = async (id) => {
    setGenLoading(id);
    await new Promise(r => setTimeout(r, 1500));
    setGenLoading('');
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center">
            <FaChartBar size={22} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Reportes & Analítica</h2>
            <p className="text-xs text-dark-400">Exporta reportes profesionales en PDF y Excel</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-dark-700/50 rounded-xl p-1 border border-dark-600/40 text-xs">
            {['week','month','quarter','year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg capitalize font-semibold transition', period === p ? 'bg-primary-600/30 text-primary-200 border border-primary-500/40' : 'text-dark-400 hover:text-white')}>{p === 'quarter' ? 'Trim.' : p}</button>
            ))}
          </div>
          <button onClick={() => generate('ia')} className="btn-secondary !px-3 !py-2 !text-sm flex items-center gap-1.5">
            {genLoading === 'ia' ? <span className="w-3.5 h-3.5 border border-primary-300/30 border-t-primary-300 rounded-full animate-spin"/> : <FaLightbulb size={12}/>}
            Generar con IA
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Proyectos Completados', v: 24, p: '+32%', c: 'primary', up: true, Ic: FaProjectDiagram },
          { l: 'Tareas Cumplidas', v: 342, p: '+18%', c: 'green', up: true, Ic: FaTasks },
          { l: 'Horas Trabajadas', v: '6,480h', p: '+15%', c: 'cyan', up: true, Ic: FaClock },
          { l: 'Utilidad Neta', v: formatCurrency(125500000), p: '+41%', c: 'yellow', up: true, Ic: FaDollarSign },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.05 }} className="card hud-corner !p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-dark-700/60 border border-dark-600/40 flex items-center justify-center">
                <k.Ic size={14} className={`text-${k.c}-400`} />
              </div>
              <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-lg', k.up ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-400')}>{k.p}</span>
            </div>
            <div className="text-[11px] text-dark-400 uppercase tracking-wider font-bold">{k.l}</div>
            <div className="text-2xl font-black heading-glow mt-1">{k.v}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card hud-corner">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><FaChartLine className="text-primary-400"/> Tendencia de Productividad</h3>
              <p className="text-xs text-dark-400">Horas trabajadas y cumplimiento</p>
            </div>
            <div className="badge-info">En tiempo real</div>
          </div>
          <LineChart
            labels={['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago']}
            datasets={[
              { label: 'Horas', data: [680,720,750,710,780,820,840,860], borderColor: '#0066ff' },
              { label: 'Cumplimiento', data: [80,83,85,82,87,90,92,94], borderColor: '#00ff88' },
            ]}
          />
        </div>
        <div className="card hud-corner">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><FaChartPie className="text-neon-purple"/> Distribución por Categoría</h3>
              <p className="text-xs text-dark-400">Ventas por categoría de proyecto</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DoughnutChart labels={['Robótica','IoT','IA/Visión','3D','Capacitación']} data={[42,24,18,10,6]} className="h-56 flex-1" />
            <div className="space-y-2 text-xs hidden md:block">
              {['Robótica','IoT','IA/Visión','3D','Capacitación'].map((l,i) => (
                <div key={l} className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary-400" style={{ opacity: 1 - i*0.15 }}/>{l}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="card hud-corner lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><FaBarChart className="text-neon-green"/> Ingresos vs Egresos (Acumulado)</h3>
              <p className="text-xs text-dark-400">Comparativo por mes del año en curso</p>
            </div>
          </div>
          <BarChart
            labels={['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']}
            datasets={[
              { label: 'Ingresos', data: [32,41,38,45,52,48,69,64,0,0,0,0] },
              { label: 'Egresos', data: [28,34,32,36,40,38,42,39,0,0,0,0] },
            ]}
          />
        </div>
      </div>

      <div className="card hud-corner !p-0 overflow-hidden">
        <div className="p-5 border-b border-dark-600/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><FaRobot className="text-neon-green"/> Plantillas de Reportes</h3>
            <p className="text-xs text-dark-400">Genera reportes personalizados y exporta</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {reports.map((r, i) => {
            const c = { primary:'from-primary-500/20 border-primary-500/40', green:'from-neon-green/20 border-neon-green/40', cyan:'from-neon-blue/20 border-neon-blue/40', purple:'from-neon-purple/20 border-neon-purple/40', yellow:'from-neon-yellow/20 border-neon-yellow/40' }[r.color];
            const loading = genLoading === r.id;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.04 }} className={`rounded-2xl p-5 bg-gradient-to-br border ${c} hover:shadow-glow-blue transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-dark-800/60 border border-dark-600/40 flex items-center justify-center">
                    <r.icon size={20} className={`text-${r.color === 'green' ? 'neon-green' : r.color === 'cyan' ? 'neon-blue' : r.color === 'purple' ? 'neon-purple' : r.color === 'yellow' ? 'neon-yellow' : 'primary-400'}`}/>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-dark-800/70 text-dark-300 uppercase tracking-wider font-bold">{r.period}</span>
                </div>
                <h4 className="font-bold text-lg mb-1">{r.title}</h4>
                <p className="text-xs text-dark-300 min-h-[40px]">{r.desc}</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => generate(r.id)} disabled={loading} className="btn-primary !py-1.5 !px-3 !text-xs flex-1 flex items-center justify-center gap-1.5">
                    {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaLightbulb size={10}/>}
                    {loading ? 'Generando...' : 'Generar'}
                  </button>
                  <button className="btn-secondary !py-1.5 !px-2 !text-xs" title="PDF"><FaFilePdf size={11}/></button>
                  <button className="btn-secondary !py-1.5 !px-2 !text-xs" title="Excel"><FaFileExcel size={11}/></button>
                  <button className="btn-secondary !py-1.5 !px-2 !text-xs" title="Imprimir"><FaPrint size={11}/></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
