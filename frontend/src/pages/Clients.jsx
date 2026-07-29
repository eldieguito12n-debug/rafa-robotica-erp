import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUserFriends, FaSearch, FaPlus, FaFileInvoiceDollar, FaProjectDiagram, FaPhone, FaEnvelope, FaMapMarkerAlt, FaDollarSign, FaDownload, FaEdit, FaEye } from 'react-icons/fa';
import { usersAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar.jsx';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try { const r = await usersAPI.clients(); setClients(r.data); } catch {}
    })();
  }, []);

  const mock = [
    { id: 1, company_name: 'TechCorp Solutions', nit: '900123456-7', contact_name: 'Cliente Demo', contact_phone: '+57 310 1234567', address: 'Calle 100 #20-30, Bogotá', credit_limit: 50000000, current_balance: 0, user: { full_name: 'Cliente Demo', email: 'cliente@robolab.com', id: 1 }, projects_count: 3, total_spent: 68500000 },
    { id: 2, company_name: 'Industrias Andinas S.A.', nit: '890.001.222-4', contact_name: 'Ana Lucía Pinto', contact_phone: '+57 311 9876543', address: 'Av. 6 #15-45, Medellín', credit_limit: 30000000, current_balance: 4500000, projects_count: 2, total_spent: 28000000 },
    { id: 3, company_name: 'AgroTech del Caribe', nit: '860.005.888-1', contact_name: 'José Morales', contact_phone: '+57 300 5554433', address: 'Carrera 5 #12-34, Barranquilla', credit_limit: 20000000, current_balance: 2500000, projects_count: 1, total_spent: 15000000 },
    { id: 4, company_name: 'LogiMove Freight', nit: '900.999.111-8', contact_name: 'Carlos Rendón', contact_phone: '+57 315 7778899', address: 'Zona Franca, Cali', credit_limit: 40000000, current_balance: 0, projects_count: 1, total_spent: 22000000 },
    { id: 5, company_name: 'HealthTech Solutions', nit: '901.222.333-9', contact_name: 'María Fernanda López', contact_phone: '+57 317 3334455', address: 'Parque Tecnológico, Bucaramanga', credit_limit: 60000000, current_balance: 9000000, projects_count: 1, total_spent: 60000000 },
    { id: 6, company_name: 'Constructora Proyectos XXI', nit: '850.444.777-3', contact_name: 'Ricardo Torres', contact_phone: '+57 320 2223344', address: 'Av. El Dorado, Bogotá', credit_limit: 35000000, current_balance: 0, projects_count: 0, total_spent: 0 },
  ];

  const list = (clients.length ? clients.map(c => ({ ...c, company_name: c.company_name || `Cliente #${c.id}`, contact_name: c.contact_name || c.user?.full_name, user: c.user || { full_name: 'User', email: '-', id: c.user_id || c.id }, projects_count: 0, total_spent: 0 })) : mock).filter(c =>
    !search ||
    (c.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.nit || '').includes(search)
  );

  const stats = {
    total: list.length,
    active: list.filter(c => (c.current_balance || 0) >= 0).length,
    debt: list.reduce((a,b)=>a+(b.current_balance||0),0),
    revenue: list.reduce((a,b)=>a+(b.total_spent||0),0),
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center">
            <FaUserFriends size={22} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Base de Datos de Clientes</h2>
            <p className="text-xs text-dark-400">{list.length} clientes · Historial, proyectos y cartera</p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="input-field !py-2 !pl-8 text-sm w-64" />
          </div>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaDownload size={12} /> Exportar</button>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12} /> Nuevo Cliente</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Clientes" value={stats.total} color="primary" />
        <Stat label="Clientes Activos" value={stats.active} color="green" />
        <Stat label="Cartera Total" value={formatCurrency(stats.debt)} color={stats.debt > 0 ? 'warning' : 'green'} />
        <Stat label="Ingresos Históricos" value={formatCurrency(stats.revenue)} color="cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.04 }} className="card hud-corner hover:shadow-glow-blue transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 blur-3xl rounded-full translate-x-16 -translate-y-16" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={c.contact_name || c.user?.full_name} id={c.user?.id || c.id} size="lg" online />
                  <div className="min-w-0">
                    <div className="font-bold text-lg truncate">{c.company_name}</div>
                    <div className="text-xs text-dark-400 font-mono">{c.nit || 'NIT sin registrar'}</div>
                  </div>
                </div>
                <span className={cn('shrink-0', c.current_balance > 0 ? 'badge-warning' : 'badge-success')}>
                  {c.current_balance > 0 ? `Saldo: ${formatCurrency(c.current_balance)}` : 'Al día'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs mb-4 border-y border-dark-600/40 py-3">
                <Row Ic={FaUserFriends} label="Contacto" value={c.contact_name || '—'} />
                <Row Ic={FaPhone} label="Teléfono" value={c.contact_phone || '—'} />
                <Row Ic={FaEnvelope} label="Email" value={c.user?.email || '—'} />
                <Row Ic={FaMapMarkerAlt} label="Dirección" value={c.address || '—'} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2 rounded-lg bg-dark-700/50">
                  <div className="text-[10px] text-dark-500 uppercase tracking-wider">Proyectos</div>
                  <div className="font-bold text-neon-blue flex items-center justify-center gap-1"><FaProjectDiagram size={10} />{c.projects_count || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-dark-700/50">
                  <div className="text-[10px] text-dark-500 uppercase tracking-wider">Cupo</div>
                  <div className="font-bold text-neon-green text-[11px]">{formatCurrency(c.credit_limit).split(',')[0]}</div>
                </div>
                <div className="p-2 rounded-lg bg-dark-700/50">
                  <div className="text-[10px] text-dark-500 uppercase tracking-wider">Total</div>
                  <div className="font-bold text-primary-300 text-[11px]">{formatCurrency(c.total_spent).split(',')[0]}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary !py-1.5 !px-3 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaEye size={11} /> Ver</button>
                <button className="btn-secondary !py-1.5 !px-3 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaFileInvoiceDollar size={11} /> Facturas</button>
                <button className="btn-primary !py-1.5 !px-3 !text-xs flex items-center justify-center gap-1.5"><FaEdit size={11} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const c = {
    primary: 'from-primary-500/20 border-primary-500/30 text-primary-300',
    green: 'from-neon-green/20 border-neon-green/30 text-neon-green',
    cyan: 'from-neon-blue/20 border-neon-blue/30 text-neon-blue',
    warning: 'from-neon-yellow/20 border-neon-yellow/30 text-neon-yellow',
  }[color] || c.primary;
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${c}`}>
      <div className="text-xs text-dark-300 font-semibold mb-1">{label}</div>
      <div className="text-2xl font-black neon-text truncate">{value}</div>
    </div>
  );
}

function Row({ Ic, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Ic size={10} className="text-dark-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-dark-500">{label}: </span>
        <span className="text-dark-200 truncate block">{value}</span>
      </div>
    </div>
  );
}
