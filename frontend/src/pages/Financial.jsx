import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FaDollarSign, FaArrowUp, FaArrowDown, FaChartPie, FaPlus, FaSearch,
  FaFilter, FaFileAlt, FaDownload, FaFileInvoiceDollar, FaTrash, FaCalculator
} from 'react-icons/fa';
import { financialAPI } from '../lib/api';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import { LineChart, DoughnutChart, BarChart } from '../components/ui/Charts.jsx';
import { useAppData } from '../context/AppDataContext';

const types = ['ingreso','egreso','compra','venta'];

const emptyForm = {
  type: 'ingreso',
  category: '',
  amount: '',
  date: new Date().toISOString().slice(0,10),
  description: '',
  reference: '',
};

export default function Financial() {
  const { addToast } = useAppData();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        financialAPI.records({ type: type || undefined, limit: 50 }).catch(() => ({ data: [] })),
        financialAPI.summary().catch(() => ({ data: { total_ingresos: 0, total_egresos: 0, utilidad: 0, caja_diaria: 0 } })),
      ]);
      setRecords(Array.isArray(r.data) ? r.data : []);
      setSummary(s.data);
    } catch (e) {
      addToast('Error cargando datos financieros', 'error');
    } finally { setLoading(false); }
  }, [type, addToast]);

  useEffect(() => { load(); }, [type]);

  const openNew = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0,10) });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (payload.amount) payload.amount = Number(payload.amount);
    try {
      await financialAPI.createRecord(payload);
      addToast('Movimiento registrado', 'success');
      setShowModal(false);
      load();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando movimiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento financiero? Esta acción no se puede deshacer.')) return;
    try {
      await financialAPI.removeRecord(id);
      addToast('Movimiento eliminado', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Error al eliminar', 'error');
    }
  };

  const list = records || [];
  const s = summary || {
    total_ingresos: list.filter(r => ['ingreso','venta'].includes(r.type)).reduce((a,b)=>a+(b.amount||0),0),
    total_egresos: list.filter(r => ['egreso','compra'].includes(r.type)).reduce((a,b)=>a+(b.amount||0),0),
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
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFilter size={12} /></button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFileAlt size={12} /> Excel</button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12} /> PDF</button>
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12} /> Nuevo</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FinCard label="Total Ingresos" value={s.total_ingresos} icon={FaArrowUp} color="green" sub={`${list.filter(r => ['ingreso','venta'].includes(r.type)).length} movimientos`} />
        <FinCard label="Total Egresos" value={s.total_egresos} icon={FaArrowDown} color="red" sub={`${list.filter(r => ['egreso','compra'].includes(r.type)).length} movimientos`} />
        <FinCard label="Utilidad / Pérdida" value={s.utilidad} icon={FaChartPie} color={s.utilidad >= 0 ? 'cyan' : 'red'} sub={s.utilidad >= 0 ? 'Resultado positivo' : 'En rojo'} positive={s.utilidad >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card hud-corner">
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

      <div className="grid grid-cols-1 gap-4">
        <div className="card hud-corner !p-0 overflow-hidden">
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
                  <th className="text-right py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="py-10 text-center"><span className="w-6 h-6 inline-block border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></td></tr>}
                {!loading && list.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-dark-500">Sin movimientos</td></tr>}
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
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDelete(r.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/15 text-red-400 inline-flex items-center justify-center transition" title="Eliminar">
                          <FaTrash size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-lg w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">Nuevo Movimiento Financiero</h3>
            <p className="text-xs text-dark-400 mb-5">Registra un ingreso, egreso, compra o venta</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Tipo *</label>
                  <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Fecha *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Monto *</label>
                  <input type="number" required min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Categoría</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field" placeholder="Ej: Nómina, Insumos..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Descripción *</label>
                <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Detalle del movimiento" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Referencia (Factura, Recibo...)</label>
                <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="input-field" placeholder="N° de documento" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Registrar Movimiento'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function FinCard({ label, value, icon: Ic, color, sub, positive }) {
  const map = {
    green: 'from-neon-green/20 border-neon-green/30 text-neon-green',
    red: 'from-red-500/20 border-red-500/30 text-red-400',
    cyan: 'from-neon-blue/20 border-neon-blue/30 text-neon-blue',
    purple: 'from-neon-purple/20 border-neon-purple/30 text-neon-purple',
  }[color] || 'from-neon-blue/20 border-neon-blue/30 text-neon-blue';
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
