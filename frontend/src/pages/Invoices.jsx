import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaFileInvoiceDollar, FaSearch, FaPlus, FaFilePdf, FaDownload, FaPrint,
  FaCalendarAlt, FaUserFriends, FaDollarSign, FaCheckCircle, FaClock, FaEnvelope, FaCreditCard,
} from 'react-icons/fa';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';

const invoices = [
  { id: 1, invoice_number: 'FAC-2025-0015', client: 'Industrias Andinas S.A.', date: '2025-07-01', due_date: '2025-07-31', subtotal: 8000000, tax: 1520000, discount: 0, total: 9520000, status: 'vencida', paid: 0 },
  { id: 2, invoice_number: 'FAC-2025-0016', client: 'AgroTech del Caribe', date: '2025-07-05', due_date: '2025-08-05', subtotal: 13500000, tax: 2565000, discount: 500000, total: 15565000, status: 'parcial', paid: 5000000 },
  { id: 3, invoice_number: 'FAC-2025-0017', client: 'TechCorp Solutions', date: '2025-07-10', due_date: '2025-08-10', subtotal: 25000000, tax: 4750000, discount: 0, total: 29750000, status: 'pendiente', paid: 0 },
  { id: 4, invoice_number: 'FAC-2025-0018', client: 'HealthTech Solutions', date: '2025-07-15', due_date: '2025-08-15', subtotal: 18000000, tax: 3420000, discount: 0, total: 21420000, status: 'pagada', paid: 21420000 },
  { id: 5, invoice_number: 'FAC-2025-0019', client: 'Constructora Proyectos XXI', date: '2025-07-20', due_date: '2025-08-20', subtotal: 48000000, tax: 9120000, discount: 2000000, total: 55120000, status: 'pagada', paid: 55120000 },
  { id: 6, invoice_number: 'FAC-2025-0020', client: 'LogiMove Freight', date: '2025-07-25', due_date: '2025-08-25', subtotal: 32000000, tax: 6080000, discount: 0, total: 38080000, status: 'pendiente', paid: 0 },
];

export default function Invoices() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const list = invoices.filter(i =>
    (!search || (i.client || '').toLowerCase().includes(search.toLowerCase()) || i.invoice_number.includes(search)) &&
    (!status || i.status === status)
  );
  const s = {
    pendiente: list.filter(i => i.status === 'pendiente').reduce((a,b)=>a+b.total,0),
    pagada: list.filter(i => i.status === 'pagada').reduce((a,b)=>a+b.total,0),
    vencida: list.filter(i => i.status === 'vencida').reduce((a,b)=>a+b.total,0),
    parcial: list.filter(i => i.status === 'parcial').reduce((a,b)=>a+b.total,0),
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
            <p className="text-xs text-dark-400">Facturas, recibos, órdenes de compra y trabajo</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-52"/></div>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="input-field !py-2 text-sm w-36"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="pagada">Pagada</option><option value="parcial">Parcial</option><option value="vencida">Vencida</option><option value="anulada">Anulada</option></select>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12}/> Exportar</button>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12}/> Factura</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Por Cobrar" value={s.pendiente + s.parcial + s.vencida} color="warning" Icon={FaClock} />
        <StatusCard label="Pagado (mes)" value={s.pagada} color="success" Icon={FaCheckCircle} />
        <StatusCard label="Vencido" value={s.vencida} color="danger" Icon={FaEnvelope} />
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
              {list.map((inv, i) => {
                const pending = inv.total - inv.paid;
                const pctPaid = Math.round((inv.paid / inv.total) * 100);
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i*0.03 }} className="border-b border-dark-700/40 hover:bg-primary-500/5 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-primary-300">{inv.invoice_number}</div>
                      <div className="text-[10px] text-dark-500 md:hidden">{formatDate(inv.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-300 flex-shrink-0"><FaUserFriends size={11} /></div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate max-w-[220px]">{inv.client}</div>
                          <div className="text-[11px] text-dark-500 flex items-center gap-1.5 sm:hidden"><span className={getStatusBadge(inv.status)}>{inv.status}</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="flex items-center gap-1.5 text-xs text-dark-300"><FaCalendarAlt size={10}/>{formatDate(inv.date)}</div></td>
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
                        <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-primary-300 flex items-center justify-center" title="Ver"><FaFileInvoiceDollar size={11}/></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-neon-red-500/15 text-dark-400 hover:text-red-400 flex items-center justify-center" title="PDF"><FaFilePdf size={11}/></button>
                        <button className="w-8 h-8 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-white flex items-center justify-center" title="Imprimir"><FaPrint size={11}/></button>
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
