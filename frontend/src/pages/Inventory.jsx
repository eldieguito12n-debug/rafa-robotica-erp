import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaBoxes, FaSearch, FaPlus, FaArrowDown, FaArrowUp, FaQrcode, FaBarcode,
  FaEdit, FaTrash, FaFileExport, FaFilter, FaExclamationTriangle,
  FaTruck, FaMapMarkerAlt, FaDollarSign, FaBox,
} from 'react-icons/fa';
import { inventoryAPI } from '../lib/api';
import { cn, formatCurrency, formatDate, formatNumber, getStatusBadge } from '../lib/utils';

const cats = ['','arduino','esp32','motores','servomotores','sensores','baterias','camaras','impresiones_3d','herramientas','consumibles','otros'];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState({ total_alerts: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        inventoryAPI.list({ category: cat || undefined, low_stock: lowOnly, search: search || undefined, limit: 200 }).catch(() => ({ data: [] })),
        inventoryAPI.alerts().catch(() => ({ data: { total_alerts: 0, items: [] } })),
      ]);
      setItems(r.data);
      setAlerts(a.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [cat, lowOnly, search]);

  const mock = [
    { id: 1, name: 'Arduino Uno R3', category: 'arduino', sku: 'ARD-UNO-001', quantity: 50, min_stock: 10, unit_cost: 45000, supplier: 'Arduino Store', location: 'Estante A-1', low_stock_alert: false },
    { id: 2, name: 'ESP32 DevKit V1', category: 'esp32', sku: 'ESP-32-001', quantity: 35, min_stock: 8, unit_cost: 75000, supplier: 'Espressif', location: 'Estante A-2', low_stock_alert: false },
    { id: 3, name: 'Servomotor SG90 Micro', category: 'servomotores', sku: 'SRV-SG90-001', quantity: 80, min_stock: 20, unit_cost: 12000, supplier: 'TowerPro', location: 'Estante B-3', low_stock_alert: false },
    { id: 4, name: 'Sensor Ultrasónico HC-SR04', category: 'sensores', sku: 'SNS-ULT-001', quantity: 3, min_stock: 10, unit_cost: 18000, supplier: 'Generic', location: 'Estante C-1', low_stock_alert: true },
    { id: 5, name: 'Motor DC 6V 200RPM', category: 'motores', sku: 'MTR-DC-001', quantity: 25, min_stock: 10, unit_cost: 25000, supplier: 'Generic', location: 'Estante B-1', low_stock_alert: false },
    { id: 6, name: 'Batería LiPo 11.1V 2200mAh', category: 'baterias', sku: 'BAT-LIPO-001', quantity: 8, min_stock: 5, unit_cost: 95000, supplier: 'Tattu', location: 'Gabinetes Seguridad', low_stock_alert: false },
    { id: 7, name: 'Raspberry Pi Camera V2 8MP', category: 'camaras', sku: 'CAM-RPI-001', quantity: 12, min_stock: 3, unit_cost: 120000, supplier: 'Raspberry', location: 'Estante C-4', low_stock_alert: false },
    { id: 8, name: 'Filamento PLA 1kg Blanco', category: 'impresiones_3d', sku: 'FIL-PLA-001', quantity: 3, min_stock: 15, unit_cost: 85000, supplier: 'Prusa', location: 'Estante D-2', low_stock_alert: true },
    { id: 9, name: 'Soldador Estaño 60W Premium', category: 'herramientas', sku: 'HERR-SOL-001', quantity: 5, min_stock: 2, unit_cost: 120000, supplier: 'Weller', location: 'Cajón Herramientas', low_stock_alert: false },
    { id: 10, name: 'Resistencias Mix 1/4W (500 pcs)', category: 'consumibles', sku: 'CONS-RES-001', quantity: 500, min_stock: 100, unit_cost: 50000, supplier: 'Generic', location: 'Cajón Componentes', low_stock_alert: false },
    { id: 11, name: 'Sensor DHT22 Temp/Humedad', category: 'sensores', sku: 'SNS-DHT-001', quantity: 2, min_stock: 8, unit_cost: 35000, supplier: 'Aosong', location: 'Estante C-2', low_stock_alert: true },
    { id: 12, name: 'Driver Motor L298N', category: 'arduino', sku: 'DRV-L298-001', quantity: 1, min_stock: 6, unit_cost: 42000, supplier: 'ST', location: 'Estante A-3', low_stock_alert: true },
  ];
  const list = (items.length ? items : mock).filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const totals = list.reduce((acc, i) => {
    acc.value += (i.quantity || 0) * (i.unit_cost || 0);
    acc.quantity += i.quantity || 0;
    acc.low += i.low_stock_alert ? 1 : 0;
    return acc;
  }, { value: 0, quantity: 0, low: 0 });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
            <FaBoxes size={22} className="text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Control de Inventario</h2>
            <p className="text-xs text-dark-400">{list.length} referencias · Entradas, salidas y alertas de stock</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-52" />
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} className="input-field !py-2 text-sm w-44">
            <option value="">Todas categorías</option>
            {cats.filter(Boolean).map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
          <button onClick={() => setLowOnly(s => !s)} className={cn('!py-2 !text-sm flex items-center gap-1.5 transition border rounded-xl px-3', lowOnly ? 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30' : 'btn-secondary')}>
            <FaExclamationTriangle size={12} /> Stock bajo
          </button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFilter size={12} /></button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFileExport size={12} /> Excel</button>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12} /> Nuevo Item</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStat label="Total Items" value={formatNumber(list.length)} icon={FaBox} color="primary" />
        <MiniStat label="Unidades Totales" value={formatNumber(totals.quantity)} icon={FaBoxes} color="cyan" />
        <MiniStat label="Valor Inventario" value={formatCurrency(totals.value)} icon={FaDollarSign} color="green" />
        <MiniStat label="Alertas Stock Bajo" value={formatNumber(alerts.total_alerts || totals.low)} icon={FaExclamationTriangle} color={totals.low > 0 ? 'red' : 'green'} highlight={totals.low > 0} />
      </div>

      {alerts.total_alerts > 0 && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl p-4 bg-neon-yellow/10 border border-neon-yellow/30 flex items-start gap-3">
          <FaExclamationTriangle size={18} className="text-neon-yellow flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="font-bold text-neon-yellow">¡{alerts.total_alerts} productos con stock crítico!</div>
            <div className="text-xs text-dark-300 mt-1 flex flex-wrap gap-2">
              {(alerts.items || []).slice(0, 5).map(i => (
                <span key={i.id} className="px-2 py-0.5 rounded bg-dark-800/70 border border-dark-600/40">
                  {i.name}: <span className="text-red-400 font-mono">{i.quantity}u</span> (min {i.min_stock})
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="card hud-corner !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/70 border-b border-dark-600/60 text-xs uppercase tracking-wider text-dark-400">
              <tr>
                <th className="text-left py-3 px-4">Producto</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Categoría</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">SKU</th>
                <th className="text-center py-3 px-4">Stock</th>
                <th className="text-right py-3 px-4 hidden md:table-cell">Vr. Unitario</th>
                <th className="text-right py-3 px-4 hidden lg:table-cell">Total</th>
                <th className="text-left py-3 px-4 hidden xl:table-cell">Ubicación</th>
                <th className="text-center py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="py-10 text-center"><span className="w-6 h-6 inline-block border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></td></tr>}
              {!loading && list.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-dark-500">Sin items</td></tr>}
              {list.map((it, i) => {
                const pct = it.min_stock > 0 ? Math.min(100, (it.quantity / it.min_stock) * 100) : 100;
                return (
                  <motion.tr key={it.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i*0.02 }} className={cn('border-b border-dark-700/40 hover:bg-dark-700/30 transition', it.low_stock_alert && 'bg-neon-yellow/5')}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', it.low_stock_alert ? 'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow' : 'bg-primary-500/10 border-primary-500/30 text-primary-300')}>
                          <FaBox size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{it.name}</div>
                          <div className="text-[11px] text-dark-500 flex items-center gap-3 md:hidden">
                            <span className={cn('capitalize', it.category === 'sensores' ? 'text-neon-green' : it.category === 'arduino' || it.category === 'esp32' ? 'text-primary-300' : 'text-dark-400')}>{String(it.category).replace(/_/g,' ')}</span>
                            {it.sku && <span className="font-mono">{it.sku}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className={cn('text-xs capitalize px-2.5 py-1 rounded-lg border font-semibold',
                        it.category === 'sensores' ? 'bg-neon-green/10 text-neon-green border-neon-green/30' :
                        it.category === 'arduino' || it.category === 'esp32' ? 'bg-primary-500/10 text-primary-300 border-primary-500/30' :
                        it.category === 'motores' || it.category === 'servomotores' ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/30' :
                        it.category === 'impresiones_3d' || it.category === 'consumibles' ? 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30' :
                        'bg-dark-600/40 text-dark-300 border-dark-500/40'
                      )}>{String(it.category).replace(/_/g,' ')}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell"><span className="font-mono text-xs text-dark-400">{it.sku || '—'}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-center gap-1 min-w-[120px]">
                        <div className={cn('font-bold', it.low_stock_alert ? 'text-red-400' : it.quantity > it.min_stock * 3 ? 'text-neon-green' : 'text-neon-yellow')}>
                          {it.quantity}
                          <span className="text-xs text-dark-500 font-normal"> /{it.min_stock}</span>
                        </div>
                        <div className="w-full progress-bar h-1.5">
                          <div className={cn('h-full rounded-full transition-all', it.low_stock_alert ? 'bg-red-500' : pct < 200 ? 'bg-neon-yellow' : 'bg-neon-green')} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right hidden md:table-cell font-mono text-xs text-dark-200">{formatCurrency(it.unit_cost)}</td>
                    <td className="py-3 px-4 text-right hidden lg:table-cell font-mono font-bold text-neon-green">{formatCurrency((it.quantity||0)*(it.unit_cost||0))}</td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-dark-300"><FaMapMarkerAlt size={10} className="text-dark-500" /> {it.location || '—'}</div>
                      {it.supplier && <div className="text-[11px] text-dark-500 mt-0.5 flex items-center gap-1"><FaTruck size={8} /> {it.supplier}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button className="w-8 h-8 rounded-lg hover:bg-neon-green/15 text-neon-green flex items-center justify-center" title="Entrada"><FaArrowDown size={11} /></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-primary-500/15 text-primary-300 flex items-center justify-center" title="Salida"><FaArrowUp size={11} /></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 flex items-center justify-center" title="QR"><FaQrcode size={11} /></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 flex items-center justify-center hidden md:inline-flex" title="Barras"><FaBarcode size={11} /></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-primary-500/15 text-primary-300 flex items-center justify-center" title="Editar"><FaEdit size={11} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Ic, color, highlight }) {
  const c = {
    primary: 'from-primary-500/20 to-transparent border-primary-500/30 text-primary-300',
    green: 'from-neon-green/20 to-transparent border-neon-green/30 text-neon-green',
    cyan: 'from-neon-blue/20 to-transparent border-neon-blue/30 text-neon-blue',
    red: 'from-red-500/20 to-transparent border-red-500/30 text-red-400',
  }[color] || c.primary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className={`card !p-4 hud-corner bg-gradient-to-br ${c} ${highlight && 'animate-pulse-slow'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-dark-400 font-semibold uppercase tracking-wider">{label}</div>
        <div className="w-9 h-9 rounded-lg bg-dark-800/60 flex items-center justify-center border border-dark-600/40"><Ic size={14} /></div>
      </div>
      <div className="text-2xl font-black neon-text truncate">{value}</div>
    </motion.div>
  );
}
