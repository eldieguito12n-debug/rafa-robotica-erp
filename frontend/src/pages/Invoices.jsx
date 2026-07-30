import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaFileInvoiceDollar, FaSearch, FaPlus, FaFilePdf, FaDownload, FaPrint,
  FaCalendarAlt, FaUserFriends, FaDollarSign, FaCheckCircle, FaClock, FaEnvelope, FaCreditCard,
  FaSyncAlt, FaTrash, FaCreditCard as FaPay, FaFileInvoice,
} from 'react-icons/fa';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import { financialAPI, clientsAPI } from '../lib/api';
import { useAppData } from '../context/AppDataContext';

export default function Invoices() {
  const { addToast } = useAppData();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ir, cr] = await Promise.allSettled([
        financialAPI.invoices(status ? { status } : {}),
        clientsAPI.list({ limit: 300 }),
      ]);
      const invs = ir.status === 'fulfilled' && Array.isArray(ir.value.data) ? ir.value.data : [];
      const cls = cr.status === 'fulfilled' && Array.isArray(cr.value.data) ? cr.value.data : [];
      setInvoices(invs);
      setClients(cls);
    } catch {
      addToast('Error cargando facturas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const byClient = (id) => clients.find(c => c.id === id);

  const list = invoices
    .map(i => {
      const c = byClient(i.client_id);
      const totalPaid = Array.isArray(i.payments) ? i.payments.reduce((a,b)=>a + (b.amount || 0), 0) : (i.amount_paid || 0);
      const st = String(i.status || 'pendiente').toLowerCase();
      // Si el backend no marca vencidas, lo hacemos aquí
      const realStatus = (st === 'pendiente' || st === 'parcial') && i.due_date && new Date(i.due_date) < new Date() ? 'vencida' : st;
      return {
        ...i,
        client_name: c ? (c.company_name || c.contact_person || `Cliente #${i.client_id}`) : (`Cliente #${i.client_id}`),
        paid: totalPaid,
        total: Number(i.total || i.total_amount || 0),
        status: realStatus,
      };
    })
    .filter(i =>
      (!search || (i.client_name || '').toLowerCase().includes(search.toLowerCase()) || (i.invoice_number || `FAC-${i.id}`).toLowerCase().includes(search.toLowerCase())) &&
      (!status || i.status === status)
    );

  const totals = {
    pendiente: list.filter(i => ['pendiente','parcial','vencida'].includes(i.status)).reduce((a,b)=>a + b.total - b.paid,0),
    pagada: list.filter(i => i.status === 'pagada').reduce((a,b)=>a+b.total,0),
    vencida: list.filter(i => i.status === 'vencida').reduce((a,b)=>a + (b.total - b.paid),0),
    parcial: list.filter(i => i.status === 'parcial').reduce((a,b)=>a + (b.total - b.paid),0),
  };

  const handleDelete = async (inv) => {
    if (!confirm(`¿Eliminar factura ${inv.invoice_number || '#'+inv.id}?`)) return;
    try {
      await financialAPI.removeInvoice(inv.id);
      addToast('Factura eliminada', 'success');
      setInvoices(prev => prev.filter(x => x.id !== inv.id));
    } catch {
      addToast('Error eliminando factura', 'error');
    }
  };

  const handleMarkPaid = async (inv) => {
    if (!confirm(`¿Marcar factura ${inv.invoice_number || '#'+inv.id} como pagada?`)) return;
    try {
      await financialAPI.updateInvoice(inv.id, { status: 'pagada' });
      addToast('Factura actualizada', 'success');
      load();
    } catch {
      addToast('Error actualizando factura', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
            <FaFileInvoiceDollar size={22} className="text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Facturación</h2>
            <p className="text-xs text-dark-400">{list.length} facturas · Emitir, seguir cobros, descargar PDF</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-52"/></div>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="input-field !py-2 text-sm w-36">
            <option value="">Todos</option><option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option><option value="parcial">Parcial</option>
            <option value="vencida">Vencida</option><option value="anulada">Anulada</option>
          </select>
          <button onClick={load} className="btn-secondary !px-3 !py-2 !text-sm" title="Refrescar"><FaSyncAlt size={12}/></button>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12}/> Exportar</button>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12}/> Factura</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Por Cobrar" value={totals.pendiente} color="warning" Icon={FaClock} />
        <StatusCard label="Pagado" value={totals.pagada} color="success" Icon={FaCheckCircle} />
        <StatusCard label="Vencido" value={totals.vencida} color="danger" Icon={FaEnvelope} />
        <StatusCard label="Total Facturado" value={list.reduce((a,b)=>a+b.total,0)} color="primary" Icon={FaCreditCard} />
      </div>

      <div className="card hud-corner !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/70 border-b border-dark-600/60 text-xs uppercase tracking-wider text-dark-400">
              <tr>
                <th className="text-left py-3 px-4"># Factura</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Fecha</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Vence</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-left py-3 px-4 hidden sm:table-cell">Pago</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({length:4}).map((_,i)=>(
                <tr key={i} className="border-b border-dark-700/40 animate-pulse"><td colSpan="8" className="py-6 px-4">&nbsp;</td></tr>
              ))}
              {!loading && list.length === 0 && (
                <tr><td colSpan="8" className="py-12 text-center text-dark-500 text-sm">
                  <FaFileInvoiceDollar size={32} className="mx-auto mb-2 opacity-40"/>Sin facturas que mostrar
                </td></tr>
              )}
              {list.map((inv, i) => {
                const pending = inv.total - inv.paid;
                const pctPaid = inv.total > 0 ? Math.round((inv.paid / inv.total) * 100) : 0;
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i*0.03 }} className="border-b border-dark-700/40 hover:bg-primary-500/5 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-primary-300">{inv.invoice_number || `FAC-${inv.id.toString().padStart(4,'0')}`}</div>
                      <div className="text-[10px] text-dark-500 md:hidden">{formatDate(inv.issue_date || inv.created_at || inv.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-300 flex-shrink-0"><FaUserFriends size={11} /></div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate max-w-[220px]">{inv.client_name}</div>
                          <div className="text-[11px] text-dark-500 flex items-center gap-1.5 sm:hidden"><span className={getStatusBadge(inv.status)}>{inv.status}</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="flex items-center gap-1.5 text-xs text-dark-300"><FaCalendarAlt size={10}/>{formatDate(inv.issue_date || inv.created_at || inv.date)}</div></td>
                    <td className={`py-3 px-4 hidden lg:table-cell text-xs ${inv.status === 'vencida' ? 'text-red-400 font-bold' : 'text-dark-300'}`}><FaCalendarAlt size={10} className="inline mr-1"/>{formatDate(inv.due_date)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-white">{formatCurrency(inv.total)}</div>
                      <div className="text-[10px] text-dark-500 mt-0.5 font-mono hidden sm:block">
                        {inv.paid > 0 ? `Pagado ${formatCurrency(inv.paid)} (${pctPaid}%)` : 'Sin pagos'}
                      </div>
                    </td>
                    <td className="py-3 px-4 min-w-[120px] hidden sm:table-cell">
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pctPaid}%` }}/></div>
                      <div className="text-[10px] text-dark-500 mt-1 font-mono">Pendiente: {formatCurrency(pending)}</div>
                    </td>
                    <td className="py-3 px-4"><span className={`${getStatusBadge(inv.status)} capitalize`}>{inv.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleMarkPaid(inv)} disabled={inv.status === 'pagada'} className="w-8 h-8 rounded-lg hover:bg-neon-green/10 text-dark-400 hover:text-neon-green disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center" title="Marcar pagada"><FaCheckCircle size={11}/></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-primary-300 flex items-center justify-center" title="Ver"><FaFileInvoice size={11}/></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-neon-red-500/15 text-dark-400 hover:text-red-400 flex items-center justify-center" title="PDF"><FaFilePdf size={11}/></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-white flex items-center justify-center" title="Imprimir"><FaPrint size={11}/></button>
                        <button onClick={() => handleDelete(inv)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 flex items-center justify-center" title="Eliminar"><FaTrash size={11}/></button>
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

function StatusCard({ label, value, color, Icon }) {
  const c = { warning: 'from-neon-yellow/20 border-neon-yellow/30 text-neon-yellow', success: 'from-neon-green/20 border-neon-green/30 text-neon-green', danger: 'from-red-500/20 border-red-500/30 text-red-400', primary: 'from-primary-500/20 border-primary-500/30 text-primary-300' }[color];
  return <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`rounded-2xl p-4 border bg-gradient-to-br ${c}`}><div className="flex items-center justify-between mb-2"><span className="text-xs text-dark-300 font-semibold uppercase tracking-wider">{label}</span><Icon size={14}/></div><div className="text-xl md:text-2xl font-black truncate">{formatCurrency(value)}</div></motion.div>;
}
