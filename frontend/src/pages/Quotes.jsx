import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaQuoteLeft, FaSearch, FaPlus, FaFilePdf, FaQrcode, FaFileExport, FaCheck, FaTimes, FaCalendarAlt, FaDollarSign, FaUserFriends, FaPrint, FaEye } from 'react-icons/fa';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';

const quotes = [
  { id: 1, quote_number: 'COT-2025-0001', title: 'Plataforma IoT Monitoreo', client: 'AgroTech del Caribe', subtotal: 12500000, tax: 12, discount: 5, total: 13312500, date: '2025-07-15', valid_until: '2025-08-15', status: 'enviada', items_count: 8 },
  { id: 2, quote_number: 'COT-2025-0002', title: 'Brazo Robótico 6DOF + Instalación', client: 'Constructora XXI', subtotal: 48000000, tax: 12, discount: 8, total: 48499200, date: '2025-07-20', valid_until: '2025-08-20', status: 'aprobada', items_count: 15 },
  { id: 3, quote_number: 'COT-2025-0003', title: 'Drone Inspección Industrial', client: 'LogiMove Freight', subtotal: 28000000, tax: 12, discount: 0, total: 31360000, date: '2025-07-25', valid_until: '2025-08-25', status: 'borrador', items_count: 6 },
  { id: 4, quote_number: 'COT-2025-0004', title: 'Sistema Detección Defectos IA', client: 'Industrias Andinas', subtotal: 32000000, tax: 12, discount: 10, total: 32256000, date: '2025-07-22', valid_until: '2025-08-22', status: 'pendiente', items_count: 12 },
  { id: 5, quote_number: 'COT-2025-0005', title: 'Kit Capacitación Robótica (10 pers)', client: 'TechCorp Solutions', subtotal: 4500000, tax: 12, discount: 0, total: 5040000, date: '2025-07-28', valid_until: '2025-08-28', status: 'aprobada', items_count: 4 },
  { id: 6, quote_number: 'COT-2025-0006', title: 'Solución Exoesqueleto Rehabilitación', client: 'HealthTech', subtotal: 72000000, tax: 12, discount: 7, total: 72835200, date: '2025-06-20', valid_until: '2025-07-20', status: 'vencida', items_count: 20 },
  { id: 7, quote_number: 'COT-2025-0007', title: 'AGV Logística 5 Unidades', client: 'LogiMove Freight', subtotal: 96000000, tax: 12, discount: 12, total: 93849600, date: '2025-07-10', valid_until: '2025-08-10', status: 'rechazada', items_count: 10 },
];

export default function Quotes() {
  const [search, setSearch] = useState('');
  const list = quotes.filter(q =>
    !search || (q.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.quote_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.client || '').toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    total: list.length,
    value: list.reduce((a,b)=>a+b.total,0),
    approved: list.filter(q => q.status === 'aprobada').length,
    pending: list.filter(q => ['pendiente','enviada','borrador'].includes(q.status)).length,
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-yellow/15 border border-neon-yellow/30 flex items-center justify-center">
            <FaQuoteLeft size={22} className="text-neon-yellow" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Cotizaciones</h2>
            <p className="text-xs text-dark-400">Genera cotizaciones profesionales con logo, firma y QR</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-56" />
          </div>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFileExport size={12} /> Excel</button>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12} /> Nueva Cotización</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Total Cotizaciones" value={totals.total} color="primary" />
        <MiniStat label="Valor Total" value={formatCurrency(totals.value)} color="green" />
        <MiniStat label="Aprobadas" value={totals.approved} color="cyan" />
        <MiniStat label="Pendientes" value={totals.pending} color="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.04 }} className="card hud-corner hover:scale-[1.01] transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FaQuoteLeft size={80} className="text-primary-500" />
            </div>
            <div className="relative">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[10px] font-mono text-dark-500 uppercase tracking-wider">{q.quote_number}</div>
                  <div className="font-bold text-lg truncate">{q.title}</div>
                </div>
                <span className={`${getStatusBadge(q.status)} shrink-0 capitalize`}>{q.status}</span>
              </div>

              <div className="space-y-1.5 text-xs mb-4 py-3 border-y border-dark-600/40">
                <Row Ic={FaUserFriends} label="Cliente" value={q.client} />
                <Row Ic={FaCalendarAlt} label="Creada" value={formatDate(q.date)} />
                <Row Ic={FaCalendarAlt} label="Válida hasta" value={formatDate(q.valid_until)} highlight={new Date(q.valid_until) < new Date()} />
                <Row Ic={FaDollarSign} label="Items" value={`${q.items_count} productos/servicios`} />
              </div>

              <div className="glass rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between text-xs text-dark-400"><span>Subtotal</span><span className="font-mono">{formatCurrency(q.subtotal)}</span></div>
                <div className="flex items-center justify-between text-xs text-dark-400"><span>IVA (19%)</span><span className="font-mono">{formatCurrency(q.subtotal * 0.19)}</span></div>
                {q.discount > 0 && <div className="flex items-center justify-between text-xs text-neon-green"><span>Descuento ({q.discount}%)</span><span className="font-mono">-{formatCurrency(q.subtotal * q.discount / 100)}</span></div>}
                <div className="divider-gradient my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-dark-300 uppercase tracking-wider">Total</span>
                  <span className="font-mono font-black text-xl text-neon-green neon-text">{formatCurrency(q.total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <ActionBtn Ic={FaEye} label="Ver" />
                <ActionBtn Ic={FaFilePdf} label="PDF" />
                <ActionBtn Ic={FaQrcode} label="QR" />
                <ActionBtn Ic={FaPrint} label="Imprimir" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {q.status !== 'aprobada' && <button className="btn-success !py-1.5 !text-xs flex items-center justify-center gap-1"><FaCheck size={11} /> Aprobar</button>}
                {q.status !== 'rechazada' && <button className="btn-danger !py-1.5 !text-xs flex items-center justify-center gap-1"><FaTimes size={11} /> Rechazar</button>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Row({ Ic, label, value, highlight }) {
  return (
    <div className="flex items-start gap-2">
      <Ic size={10} className="text-dark-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-dark-500">{label}: </span>
        <span className={cn('truncate block', highlight && 'text-red-400 font-bold')}>{value}</span>
      </div>
    </div>
  );
}

function ActionBtn({ Ic, label }) {
  return (
    <button className="py-2 rounded-lg text-[10px] bg-dark-700/60 hover:bg-primary-600/20 hover:text-primary-300 text-dark-300 border border-dark-600 hover:border-primary-500/40 transition flex flex-col items-center gap-1">
      <Ic size={13} />
      {label}
    </button>
  );
}

function MiniStat({ label, value, color }) {
  const c = { primary: 'from-primary-500/20 border-primary-500/30 text-primary-300', green: 'from-neon-green/20 border-neon-green/30 text-neon-green', cyan: 'from-neon-blue/20 border-neon-blue/30 text-neon-blue', warning: 'from-neon-yellow/20 border-neon-yellow/30 text-neon-yellow' }[color];
  return <div className={`rounded-2xl p-4 border bg-gradient-to-br ${c}`}><div className="text-xs text-dark-300 font-semibold mb-1">{label}</div><div className="text-xl font-black truncate">{value}</div></div>;
}
