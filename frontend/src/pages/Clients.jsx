import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaUserFriends, FaSearch, FaPlus, FaFileInvoiceDollar, FaProjectDiagram, FaPhone, FaEnvelope, FaMapMarkerAlt, FaDollarSign, FaDownload, FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { clientsAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar.jsx';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import { useAppData } from '../context/AppDataContext';

const emptyForm = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  tax_id: '',
  status: 'activo',
};

export default function Clients() {
  const { addToast } = useAppData();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clientsAPI.list({ limit: 200 });
      setClients(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      addToast('Error cargando clientes', 'error');
      setClients([]);
    } finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      company_name: c.company_name || '',
      contact_person: c.contact_person || c.contact_name || c.user?.full_name || '',
      email: c.email || c.user?.email || '',
      phone: c.phone || c.contact_phone || '',
      address: c.address || '',
      tax_id: c.tax_id || c.nit || '',
      status: c.status || (c.current_balance >= 0 ? 'activo' : 'inactivo'),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await clientsAPI.update(editing, form);
        addToast('Cliente actualizado', 'success');
      } else {
        await clientsAPI.create(form);
        addToast('Cliente creado', 'success');
      }
      setShowModal(false);
      load();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`¿Eliminar cliente "${c.company_name || `Cliente #${c.id}`}"? Esta acción no se puede deshacer.`)) return;
    try {
      await clientsAPI.remove(c.id);
      addToast('Cliente eliminado', 'success');
      load();
    } catch {
      addToast('Error eliminando cliente', 'error');
    }
  };

  const list = (clients || []).map(c => ({
    ...c,
    company_name: c.company_name || c.name || `Cliente #${c.id}`,
    contact_name: c.contact_person || c.contact_name || c.user?.full_name || '',
    contact_phone: c.phone || c.contact_phone || '',
    nit: c.tax_id || c.nit || '',
    user: c.user || { full_name: c.contact_person || c.contact_name || 'User', email: c.email || '-', id: c.user_id || c.id },
    projects_count: c.projects_count || 0,
    total_spent: c.total_spent || 0,
    current_balance: c.current_balance || 0,
  })).filter(c =>
    !search ||
    (c.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.nit || '').includes(search)
  );

  const stats = {
    total: list.length,
    active: list.filter(c => c.status === 'activo' || (c.current_balance || 0) >= 0).length,
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
          <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12} /> Nuevo Cliente</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Clientes" value={stats.total} color="primary" />
        <Stat label="Clientes Activos" value={stats.active} color="green" />
        <Stat label="Cartera Total" value={formatCurrency(stats.debt)} color={stats.debt > 0 ? 'warning' : 'green'} />
        <Stat label="Ingresos Históricos" value={formatCurrency(stats.revenue)} color="cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && list.length === 0 ? (
          <div className="col-span-full text-center py-12 text-dark-500">Cargando clientes...</div>
        ) : (
          list.map((c, i) => (
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
                  <div className="flex items-start gap-1">
                    <span className={cn('shrink-0', (c.current_balance || 0) > 0 ? 'badge-warning' : 'badge-success')}>
                      {(c.current_balance || 0) > 0 ? `Saldo: ${formatCurrency(c.current_balance)}` : 'Al día'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mb-4 border-y border-dark-600/40 py-3">
                  <Row Ic={FaUserFriends} label="Contacto" value={c.contact_name || '—'} />
                  <Row Ic={FaPhone} label="Teléfono" value={c.contact_phone || '—'} />
                  <Row Ic={FaEnvelope} label="Email" value={c.user?.email || c.email || '—'} />
                  <Row Ic={FaMapMarkerAlt} label="Dirección" value={c.address || '—'} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="p-2 rounded-lg bg-dark-700/50">
                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Proyectos</div>
                    <div className="font-bold text-neon-blue flex items-center justify-center gap-1"><FaProjectDiagram size={10} />{c.projects_count || 0}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-dark-700/50">
                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Cupo</div>
                    <div className="font-bold text-neon-green text-[11px]">{formatCurrency(c.credit_limit || 0).split(',')[0]}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-dark-700/50">
                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Total</div>
                    <div className="font-bold text-primary-300 text-[11px]">{formatCurrency(c.total_spent || 0).split(',')[0]}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn-secondary !py-1.5 !px-3 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaEye size={11} /> Ver</button>
                  <button onClick={() => openEdit(c)} className="btn-secondary !py-1.5 !px-3 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaEdit size={11} /> Editar</button>
                  <button onClick={() => handleDelete(c)} className="btn-danger !py-1.5 !px-3 !text-xs flex items-center justify-center gap-1.5" title="Eliminar"><FaTrash size={11} /></button>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loading && list.length === 0 && <div className="col-span-full text-center py-12 text-dark-500">No hay clientes para mostrar</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10">
            <h3 className="text-xl font-bold heading-glow mb-1">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <p className="text-xs text-dark-400 mb-5">Datos del cliente</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Empresa / Nombre *</label>
                <input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="input-field" placeholder="Nombre de la empresa" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Persona de Contacto</label>
                  <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} className="input-field" placeholder="Nombre contacto" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">NIT / Identificación</label>
                  <input value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} className="input-field" placeholder="NIT, cédula..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="cliente@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+57 ..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Dirección</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" placeholder="Dirección completa" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : (editing ? 'Guardar Cambios' : 'Crear Cliente')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  const c = {
    primary: 'from-primary-500/20 border-primary-500/30 text-primary-300',
    green: 'from-neon-green/20 border-neon-green/30 text-neon-green',
    cyan: 'from-neon-blue/20 border-neon-blue/30 text-neon-blue',
    warning: 'from-neon-yellow/20 border-neon-yellow/30 text-neon-yellow',
  }[color] || 'from-primary-500/20 border-primary-500/30 text-primary-300';
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
