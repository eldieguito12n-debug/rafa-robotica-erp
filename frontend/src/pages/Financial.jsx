import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalculator, FaPlus, FaFileInvoiceDollar, FaArrowUp, FaArrowDown,
  FaChartPie, FaDollarSign, FaFileAlt, FaDownload, FaSearch, FaFilter,
} from 'react-icons/fa';
import { financialAPI } from '../lib/api';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import { LineChart, DoughnutChart, BarChart } from '../components/ui/Charts.jsx';

const types = ['','ingreso','egreso','compra','venta'];

export default function Financial() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, s] = await Promise.all([
          financialAPI.records({ type: type || undefined, limit: 50 }).catch(() => ({ data: [] })),
          financialAPI.summary().catch(() => ({ data: { total_ingresos: 0, total_egresos: 0, utilidad: 0, caja_diaria: 0 } })),
        ]);
        setRecords(r.data);
        setSummary(s.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [type]);

  const mock = [
    { id: 1, type: 'venta', description: 'Factura #001 - Brazo Robótico 6DOF', amount: 45000000, date: '2024-12-10', category: 'Ventas Proyectos', payment_method: 'Transferencia' },
    { id: 2, type: 'ingreso', description: 'Abono #003 - Robot Entrega (50%)', amount: 12500000, date: '2025-07-02', category: 'Abonos', payment_method: 'PSE' },
    { id: 3, type: 'compra', description: 'Compra componentes Lote #12', amount: 5500000, date: '2025-07-05', category: 'Insumos', payment_method: 'Crédito 30d' },
    { id: 4, type: 'egreso', description: 'Nómina mes Julio', amount: 28000000, date: '2025-07-15', category: 'Nómina', payment_method: 'Transferencia' },
    { id: 5, type: 'egreso', description: 'Mantenimiento equipos A/C', amount: 3500000, date: '2025-07-10', category: 'Mantenimiento', payment_method: 'Efectivo' },
    { id: 6, type: 'venta', description: 'Cotización #007 - TechCorp', amount: 8500000, date: '2025-07-18', category: 'Cotizaciones', payment_method: 'Transferencia' },
    { id: 7, type: 'ingreso', description: 'Pago parcial Factura #004', amount: 3000000, date: '2025-07-22', category: 'Cobros', payment_method: 'Cheque' },
    { id: 8, type: 'egreso', description: 'Servicios públicos mes', amount: 2100000, date: '2025-07-25', category: 'Servicios', payment_method: 'PSE' },
    { id: 9, type: 'compra', description: 'Materiales impresión 3D', amount: 2800000, date: '2025-07-28', category: 'Insumos 3D', payment_method: 'TC' },
    { id: 10, type: 'venta', description: 'Curso capacitación robótica', amount: 4500000, date: '2025-07-29', category: 'Capacitaciones', payment_method: 'Transferencia' },
  ];
  const list = records.length ? records : mock;
  const s = summary || {
    total_ingresos: list.filter(r => ['ingreso','venta'].includes(r.type)).reduce((a,b)=>a+b.amount,0),
    total_egresos: list.filter(r => ['egreso','compra'].includes(r.type)).reduce((a,b)=>a+b.amount,0),
  };
  s.utilidad = s.total_ingresos - s.total_egresos;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
            <FaCalculator size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Módulo Financiero</h2>
            <p className="text-xs text-dark-400">Ingresos, egresos, facturación y reportes contables</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-44" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)} className="input-field !py-2 text-sm w-36">
            <option value="">Todos</option>
            {types.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFilter size={12} /></button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFileAlt size={12} /> Excel</button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12} /> PDF</button>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12} /> Nuevo</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinCard label="Total Ingresos" value={s.total_ingresos} icon={FaArrowUp} color="green" sub={`${list.filter(r => ['ingreso','venta'].includes(r.type)).length} movimientos`} />
        <FinCard label="Total Egresos" value={s.total_egresos} icon={FaArrowDown} color="red" sub={`${list.filter(r => ['egreso','compra'].includes(r.type)).length} movimientos`} />
        <FinCard label="Utilidad / Pérdida" value={s.utilidad} icon={FaChartPie} color={s.utilidad >= 0 ? 'cyan' : 'red'} sub={s.utilidad >= 0 ? 'Resultado positivo' : 'En rojo'} positive={s.utilidad >= 0} />
        <FinCard label="Caja Diaria" value={s.caja_diaria || 18500000} icon={FaDollarSign} color="purple" sub="Efectivo + bancos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card hud-corner lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Flujo de Caja (Últimos 6 meses)</h3>
              <p className="text-xs text-dark-400">Tendencia de ingresos vs egresos</p>
            </div>
          </div>
          <LineChart
            labels={['Feb','Mar','Abr','May','Jun','Jul']}
            datasets={[
              { label: 'Ingresos', data: [32,38,45,42,51,69], borderColor: '#00ff88' },
              { label: 'Egresos', data: [28,31,34,36,40,42], borderColor: '#ff5577' },
              { label: 'Utilidad', data: [4,7,11,6,11,27], borderColor: '#00d4ff' },
            ]}
          />
        </div>
        <div className="card hud-corner">
          <h3 className="font-bold text-lg mb-1">Distribución Gastos</h3>
          <p className="text-xs text-dark-400 mb-4">Por categoría</p>
          <DoughnutChart labels={['Nómina','Insumos','Servicios','Mantenimiento','Otros']} data={[42,22,18,8,10]} className="h-56" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card hud-corner lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-5 border-b border-dark-600/50 flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2"><FaFileInvoiceDollar className="text-primary-400" /> Movimientos Recientes</h3>
            <span className="text-xs badge-info">{list.length} registros</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-dark-800/50 text-xs uppercase text-dark-400 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4">Fecha</th>
                  <th className="text-left py-3 px-4">Descripción</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Tipo</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Categoría</th>
                  <th className="text-right py-3 px-4">Monto</th>
                </tr>
              </thead>
              <tbody>
                {list.map(r => {
                  const ing = ['ingreso','venta'].includes(r.type);
                  return (
                    <tr key={r.id} className="border-b border-dark-700/40 hover:bg-dark-700/30 transition">
                      <td className="py-3 px-4 text-xs text-dark-400 font-mono">{formatDate(r.date)}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium truncate max-w-xs">{r.description}</div>
                        <div className="text-[11px] text-dark-500 hidden md:block lg:hidden">{r.category}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell"><span className={getStatusBadge(r.type)}>{r.type}</span></td>
                      <td className="py-3 px-4 text-xs text-dark-400 hidden lg:table-cell">{r.category}</td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${ing ? 'text-neon-green' : 'text-red-400'}`}>
                        {ing ? '+' : '-'}{formatCurrency(r.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card hud-corner">
          <h3 className="font-bold text-lg mb-4">Ingresos por Proyecto</h3>
          <BarChart
            labels={['P#001','P#002','P#003','P#004','P#005','P#006']}
            datasets={[{ label: 'COP (M)', data: [45,12.5,28,18,8,4.5] }]}
            className="h-56"
          />
          <div className="mt-4 pt-4 border-t border-dark-600/50 space-y-2">
            {[
              { l: 'Proyectos facturados', v: '8', c: 'text-neon-green' },
              { l: 'Facturas pendientes', v: '3', c: 'text-neon-yellow' },
              { l: 'Cartera vencida', v: formatCurrency(4200000), c: 'text-red-400' },
            ].map(x => (
              <div key={x.l} className="flex items-center justify-between text-sm">
                <span className="text-dark-400">{x.l}</span>
                <span className={cn('font-bold', x.c)}>{x.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinCard({ label, value, icon: Ic, color, sub, positive }) {
  const map = {
    green: 'from-neon-green/20 border-neon-green/30 text-neon-green',
    red: 'from-red-500/20 border-red-500/30 text-red-400',
    cyan: 'from-neon-blue/20 border-neon-blue/30 text-neon-blue',
    purple: 'from-neon-purple/20 border-neon-purple/30 text-neon-purple',
  }[color] || map.cyan;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`card hud-corner !p-5 bg-gradient-to-br ${map}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-dark-400 font-bold mb-1">{label}</div>
          <div className="text-2xl md:text-3xl font-black neon-text my-1">{formatCurrency(value)}</div>
          <div className="text-xs text-dark-400 flex items-center gap-1.5">
            {positive !== undefined && (positive ? <FaArrowUp size={9} className="text-neon-green" /> : <FaArrowDown size={9} className="text-red-400" />)}
            {sub}
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-dark-800/60 border border-dark-600/40 flex items-center justify-center">
          <Ic size={18} />
        </div>
      </div>
    </motion.div>
  );
}
