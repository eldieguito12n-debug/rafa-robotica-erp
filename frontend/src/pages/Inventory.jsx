import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FaBoxes, FaSearch, FaPlus, FaArrowDown, FaArrowUp, FaQrcode, FaBarcode,
  FaEdit, FaTrash, FaFileExport, FaFilter, FaExclamationTriangle,
  FaTruck, FaMapMarkerAlt, FaDollarSign, FaBox, FaHistory, FaUser,
  FaLock,
} from 'react-icons/fa';
import { inventoryAPI } from '../lib/api';
import { cn, formatCurrency, formatDate, formatNumber } from '../lib/utils';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import RoleGuard from '../components/ui/RoleGuard.jsx';

const cats = ['','arduino','esp32','motores','servomotores','sensores','baterias','camaras','impresiones_3d','herramientas','consumibles','otros'];
const emptyItemForm = { name: '', category: '', sku: '', quantity: 0, min_stock: 0, unit_cost: 0, supplier: '', location: '' };
const emptyMoveForm = { quantity: '', reference: '', notes: '', project_id: '' };

export default function Inventory() {
  const { addToast } = useAppData();
  const { isAdmin, user } = useAuth();
  const admin = isAdmin();

  const [tab, setTab] = useState('stock'); // 'stock' | 'history'
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState({ total_alerts: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingItem, setEditingItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);

  const [moveType, setMoveType] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [moveForm, setMoveForm] = useState(emptyMoveForm);
  const [savingMove, setSavingMove] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        inventoryAPI.list({ category: cat || undefined, low_stock: lowOnly || undefined, search: search || undefined, limit: 200 }),
        inventoryAPI.alerts().catch(() => ({ data: { total_alerts: 0, items: [] } })),
      ]);
      setItems(Array.isArray(r?.data) ? r.data : []);
      setAlerts(a?.data || { total_alerts: 0, items: [] });
    } catch {
      addToast('Error cargando inventario', 'error');
      setItems([]);
    } finally { setLoading(false); }
  }, [cat, lowOnly, search, addToast]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await inventoryAPI.history({ limit: 200 });
      setHistory(Array.isArray(res?.data) ? res.data : []);
    } catch {
      addToast('Error cargando historial', 'error');
    } finally { setHistoryLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [cat, lowOnly, search]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm(emptyItemForm);
    setShowNew(true);
  };

  const openEditItem = (it) => {
    setEditingItem(it.id);
    setItemForm({ name: it.name || '', category: it.category || '', sku: it.sku || '', quantity: it.quantity || 0, min_stock: it.min_stock || 0, unit_cost: it.unit_cost || 0, supplier: it.supplier || '', location: it.location || '' });
    setShowNew(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    const payload = { ...itemForm, quantity: Number(itemForm.quantity), min_stock: Number(itemForm.min_stock), unit_cost: Number(itemForm.unit_cost) };
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem, payload);
        addToast('Artículo actualizado', 'success');
      } else {
        await inventoryAPI.create(payload);
        addToast('Artículo creado', 'success');
      }
      setShowNew(false);
      load();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando artículo', 'error');
    } finally { setSavingItem(false); }
  };

  const handleDeleteItem = async (it) => {
    if (!confirm(`¿Eliminar "${it.name}" del inventario?`)) return;
    try {
      await inventoryAPI.remove(it.id);
      addToast('Artículo eliminado', 'success');
      load();
    } catch { addToast('Error eliminando artículo', 'error'); }
  };

  const openMove = (type, it) => {
    // Solo admins pueden hacer entradas
    if (type === 'entrada' && !admin) {
      addToast('Acceso denegado — Solo administradores pueden agregar existencias', 'error');
      return;
    }
    if (it.quantity === 0 && type === 'salida') {
      addToast('Sin existencias — Este artículo no tiene stock disponible', 'warning');
      return;
    }
    setMoveType(type);
    setMoveItem(it);
    setMoveForm(emptyMoveForm);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!moveItem || !moveType) return;
    const qty = Number(moveForm.quantity);
    if (moveType === 'salida' && qty > moveItem.quantity) {
      addToast(`Stock insuficiente. Disponible: ${moveItem.quantity} unidad(es).`, 'error');
      return;
    }
    setSavingMove(true);
    try {
      const res = await inventoryAPI.move(
        moveItem.id,
        moveType,
        qty,
        moveForm.reference || undefined,
        moveForm.notes || undefined,
        moveForm.project_id ? Number(moveForm.project_id) : undefined,
      );
      addToast(res?.data?.message || `Movimiento de ${moveType} registrado`, 'success');
      setMoveType(null);
      setMoveItem(null);
      load();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error registrando movimiento', 'error');
    } finally { setSavingMove(false); }
  };

  const list = (items || []).filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExportExcel = () => {
    const csvContent = [
      ['ID', 'Nombre', 'Categoria', 'SKU', 'Cantidad', 'Min Stock', 'Costo Unitario', 'Valor Total', 'Proveedor', 'Ubicacion'].join(','),
      ...list.map(it => [
        it.id,
        `"${(it.name || '').replace(/"/g, '""')}"`,
        `"${(it.category || '').replace(/"/g, '""')}"`,
        `"${(it.sku || '').replace(/"/g, '""')}"`,
        it.quantity || 0,
        it.min_stock || 0,
        it.unit_cost || 0,
        (it.quantity || 0) * (it.unit_cost || 0),
        `"${(it.supplier || '').replace(/"/g, '""')}"`,
        `"${(it.location || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = list.reduce((acc, i) => {
    acc.value += (i.quantity || 0) * (i.unit_cost || 0);
    acc.quantity += i.quantity || 0;
    acc.low += i.low_stock_alert ? 1 : 0;
    return acc;
  }, { value: 0, quantity: 0, low: 0 });

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
            <FaBoxes size={22} className="text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Control de Inventario</h2>
            <p className="text-xs text-dark-400">
              {list.length} referencias ·{' '}
              {admin ? 'Entradas, salidas y alertas de stock' : 'Puedes retirar materiales para tu trabajo'}
            </p>
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
          <RoleGuard adminOnly>
            <button onClick={handleExportExcel} className="btn-secondary !px-3 !py-2 !text-sm"><FaFileExport size={12} /> Excel</button>
            <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNewItem}><FaPlus size={12} /> Nuevo Item</button>
          </RoleGuard>
        </div>
      </motion.div>

      {/* Indicador de permisos para no-admins */}
      {!admin && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl p-3 bg-primary-500/10 border border-primary-500/30 flex items-center gap-3">
          <FaLock size={14} className="text-primary-400 flex-shrink-0" />
          <p className="text-xs text-primary-300">
            <span className="font-semibold">Modo consulta y retiro:</span> Puedes ver el inventario y registrar salidas de materiales para tu trabajo. Para agregar existencias, contacta a un administrador.
          </p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStat label="Total Items" value={formatNumber(list.length)} icon={FaBox} color="primary" />
        <MiniStat label="Unidades Totales" value={formatNumber(totals.quantity)} icon={FaBoxes} color="cyan" />
        <MiniStat label="Valor Inventario" value={formatCurrency(totals.value)} icon={FaDollarSign} color="green" />
        <MiniStat label="Alertas Stock Bajo" value={formatNumber(alerts.total_alerts || totals.low)} icon={FaExclamationTriangle} color={totals.low > 0 ? 'red' : 'green'} highlight={totals.low > 0} />
      </div>

      {/* Alerta de stock crítico */}
      {(alerts.total_alerts || 0) > 0 && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl p-4 bg-neon-yellow/10 border border-neon-yellow/30 flex items-start gap-3">
          <FaExclamationTriangle size={18} className="text-neon-yellow flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="font-bold text-neon-yellow">¡{alerts.total_alerts} productos con stock crítico!</div>
            <div className="text-xs text-dark-300 mt-1 flex flex-wrap gap-2">
              {(alerts.items || []).slice(0, 5).map(i => (
                <span key={i.id} className="px-2 py-0.5 rounded bg-dark-800/70 border border-dark-600/40">
                  {i.name}: <span className="text-red-400 font-mono">{i.quantity === 0 ? 'Sin existencias' : `${i.quantity}u`}</span> (min {i.min_stock})
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs: Stock | Historial */}
      <div className="flex gap-2">
        <button onClick={() => setTab('stock')} className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition', tab === 'stock' ? 'bg-primary-500/20 border-primary-500/40 text-primary-300' : 'border-dark-600/40 text-dark-400 hover:text-white hover:bg-dark-700/40')}>
          <FaBoxes size={12} className="inline mr-1.5" /> Stock
        </button>
        <button onClick={() => setTab('history')} className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition', tab === 'history' ? 'bg-neon-green/15 border-neon-green/30 text-neon-green' : 'border-dark-600/40 text-dark-400 hover:text-white hover:bg-dark-700/40')}>
          <FaHistory size={12} className="inline mr-1.5" /> Historial de Movimientos
        </button>
      </div>

      {/* ─── Tab Stock ─────────────────────────────────────── */}
      {tab === 'stock' && (
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
                  const sinExistencias = it.quantity === 0;
                  return (
                    <motion.tr key={it.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.02 }} className={cn('border-b border-dark-700/40 hover:bg-dark-700/30 transition', it.low_stock_alert && 'bg-neon-yellow/5')}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', sinExistencias ? 'bg-red-500/10 border-red-500/30 text-red-400' : it.low_stock_alert ? 'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow' : 'bg-primary-500/10 border-primary-500/30 text-primary-300')}>
                            <FaBox size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{it.name}</div>
                            <div className="text-[11px] text-dark-500 flex items-center gap-3 md:hidden">
                              <span className="capitalize">{String(it.category).replace(/_/g,' ')}</span>
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
                          'bg-dark-600/40 text-dark-300 border-dark-500/40'
                        )}>{String(it.category || 'otros').replace(/_/g,' ')}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell"><span className="font-mono text-xs text-dark-400">{it.sku || '—'}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1 min-w-[120px]">
                          <div className={cn('font-bold', sinExistencias ? 'text-red-400' : it.low_stock_alert ? 'text-neon-yellow' : 'text-neon-green')}>
                            {sinExistencias ? <span className="text-xs font-semibold">Sin existencias</span> : it.quantity}
                            {!sinExistencias && <span className="text-xs text-dark-500 font-normal"> /{it.min_stock}</span>}
                          </div>
                          <div className="w-full progress-bar h-1.5">
                            <div className={cn('h-full rounded-full transition-all', sinExistencias ? 'bg-red-500' : it.low_stock_alert ? 'bg-neon-yellow' : 'bg-neon-green')} style={{ width: sinExistencias ? '100%' : `${pct}%` }} />
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
                          {/* Entrada — solo admins */}
                          {admin && (
                            <button onClick={() => openMove('entrada', it)} className="w-8 h-8 rounded-lg hover:bg-neon-green/15 text-neon-green flex items-center justify-center" title="Registrar Entrada">
                              <FaArrowDown size={11} />
                            </button>
                          )}
                          {/* Salida — todos (si hay stock) */}
                          <button
                            onClick={() => openMove('salida', it)}
                            disabled={sinExistencias}
                            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition', sinExistencias ? 'text-dark-600 cursor-not-allowed' : 'hover:bg-primary-500/15 text-primary-300')}
                            title={sinExistencias ? 'Sin existencias' : 'Registrar Salida'}
                          >
                            <FaArrowUp size={11} />
                          </button>
                          <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 flex items-center justify-center" title="QR"><FaQrcode size={11} /></button>
                          {/* Editar/Eliminar — solo admins */}
                          {admin && (
                            <>
                              <button onClick={() => openEditItem(it)} className="w-8 h-8 rounded-lg hover:bg-primary-500/15 text-primary-300 flex items-center justify-center" title="Editar"><FaEdit size={11} /></button>
                              <button onClick={() => handleDeleteItem(it)} className="w-8 h-8 rounded-lg hover:bg-red-600/15 text-red-400 flex items-center justify-center" title="Eliminar"><FaTrash size={11} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Tab Historial ─────────────────────────────────── */}
      {tab === 'history' && (
        <div className="card hud-corner !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-800/70 border-b border-dark-600/60 text-xs uppercase tracking-wider text-dark-400">
                <tr>
                  <th className="text-left py-3 px-4">Fecha y Hora</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-left py-3 px-4">Producto</th>
                  <th className="text-center py-3 px-4">Cantidad</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Usuario</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Rol</th>
                  <th className="text-left py-3 px-4 hidden xl:table-cell">Referencia / Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading && <tr><td colSpan={7} className="py-10 text-center"><span className="w-6 h-6 inline-block border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></td></tr>}
                {!historyLoading && history.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-dark-500">Sin movimientos registrados</td></tr>}
                {history.map((mv, i) => (
                  <motion.tr key={mv.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.015 }} className="border-b border-dark-700/40 hover:bg-dark-700/20 transition">
                    <td className="py-3 px-4 text-xs text-dark-300 font-mono">{formatDate(mv.created_at)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-xs px-2.5 py-1 rounded-lg border font-bold', mv.type === 'entrada' ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : 'bg-primary-500/10 text-primary-300 border-primary-500/30')}>
                        {mv.type === 'entrada' ? '↓ Entrada' : '↑ Salida'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{mv.item_name || `Item #${mv.item_id}`}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('font-bold font-mono', mv.type === 'entrada' ? 'text-neon-green' : 'text-primary-300')}>
                        {mv.type === 'entrada' ? '+' : '-'}{mv.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <FaUser size={10} className="text-dark-500" />
                        <span className="text-dark-200">{mv.user_name || `Usuario #${mv.user_id}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded bg-dark-700/60 text-dark-300 capitalize">
                        {mv.user_role ? mv.user_role.replace(/_/g, ' ') : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell text-xs text-dark-400">
                      {mv.reference && <div className="font-mono">{mv.reference}</div>}
                      {mv.notes && <div className="text-dark-500">{mv.notes}</div>}
                      {!mv.reference && !mv.notes && '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal: Nuevo / Editar Item (solo admin) ─── */}
      {showNew && admin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">{editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
            <p className="text-xs text-dark-400 mb-5">Datos del artículo de inventario</p>
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Nombre *</label>
                  <input required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="input-field" placeholder="Ej: Arduino Uno R3" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Categoría</label>
                  <select value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} className="input-field">
                    <option value="">Seleccionar...</option>
                    {cats.filter(Boolean).map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">SKU</label>
                  <input value={itemForm.sku} onChange={e => setItemForm({ ...itemForm, sku: e.target.value })} className="input-field" placeholder="Ej: ARD-UNO-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Cantidad Inicial</label>
                  <input type="number" min="0" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Stock Mínimo</label>
                  <input type="number" min="0" value={itemForm.min_stock} onChange={e => setItemForm({ ...itemForm, min_stock: e.target.value })} className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Costo Unitario</label>
                  <input type="number" min="0" value={itemForm.unit_cost} onChange={e => setItemForm({ ...itemForm, unit_cost: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Proveedor</label>
                  <input value={itemForm.supplier} onChange={e => setItemForm({ ...itemForm, supplier: e.target.value })} className="input-field" placeholder="Nombre proveedor" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Ubicación</label>
                  <input value={itemForm.location} onChange={e => setItemForm({ ...itemForm, location: e.target.value })} className="input-field" placeholder="Ej: Estante A-1" />
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={savingItem} className="btn-primary">{savingItem ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Crear Artículo'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── Modal: Movimiento ─── */}
      {moveType && moveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => { setMoveType(null); setMoveItem(null); }} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-md w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">
              {moveType === 'entrada' ? '📥 Entrada de Inventario' : '📤 Salida de Inventario'}
            </h3>
            <p className="text-xs text-dark-400 mb-4">
              Item: <span className="text-white font-semibold">{moveItem.name}</span> · Stock actual: <span className="font-mono">{moveItem.quantity === 0 ? 'Sin existencias' : `${moveItem.quantity} u`}</span>
            </p>
            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Cantidad *</label>
                <input type="number" required min="1" max={moveType === 'salida' ? moveItem.quantity : undefined} value={moveForm.quantity} onChange={e => setMoveForm({ ...moveForm, quantity: e.target.value })} className="input-field" placeholder="Cantidad de unidades" />
                {moveType === 'salida' && <p className="text-xs text-dark-500 mt-1">Máximo disponible: <span className="text-neon-yellow font-mono">{moveItem.quantity}</span> u.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Proyecto relacionado (opcional)</label>
                <input value={moveForm.project_id} onChange={e => setMoveForm({ ...moveForm, project_id: e.target.value })} className="input-field" placeholder="ID del proyecto (ej: 3)" type="number" min="1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Referencia / N° Factura</label>
                <input value={moveForm.reference} onChange={e => setMoveForm({ ...moveForm, reference: e.target.value })} className="input-field" placeholder="Ej: FAC-00123, Ajuste..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Observaciones</label>
                <textarea value={moveForm.notes} onChange={e => setMoveForm({ ...moveForm, notes: e.target.value })} className="input-field min-h-[70px]" placeholder="Observaciones..." />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => { setMoveType(null); setMoveItem(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={savingMove} className={moveType === 'entrada' ? 'btn-success' : 'btn-primary'}>
                  {savingMove ? 'Procesando...' : moveType === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon: Ic, color, highlight }) {
  const c = {
    primary: 'from-primary-500/20 to-transparent border-primary-500/30 text-primary-300',
    green: 'from-neon-green/20 to-transparent border-neon-green/30 text-neon-green',
    cyan: 'from-neon-blue/20 to-transparent border-neon-blue/30 text-neon-blue',
    red: 'from-red-500/20 to-transparent border-red-500/30 text-red-400',
  }[color] || 'from-primary-500/20 to-transparent border-primary-500/30 text-primary-300';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`card !p-4 hud-corner bg-gradient-to-br ${c} ${highlight && 'animate-pulse-slow'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-dark-400 font-semibold uppercase tracking-wider">{label}</div>
        <div className="w-9 h-9 rounded-lg bg-dark-800/60 flex items-center justify-center border border-dark-600/40"><Ic size={14} /></div>
      </div>
      <div className="text-2xl font-black neon-text truncate">{value}</div>
    </motion.div>
  );
}
