import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn, formatCurrency, formatDate, getStatusBadge } from '../lib/utils';
import { FaWhatsapp, FaTrash, FaQuoteLeft, FaSearch, FaPlus, FaFilePdf, FaFileExport, FaCheck, FaTimes, FaCalendarAlt, FaDollarSign, FaUserFriends, FaPrint, FaEye } from 'react-icons/fa';
import api, { financialAPI, clientsAPI } from '../lib/api';
import { useAppData } from '../context/AppDataContext';

const statusOptions = ['borrador', 'enviada', 'aprobada', 'rechazada', 'vencida'];

const emptyForm = {
  client_id: '',
  title: '',
  valid_until: '',
  subtotal: '',
  tax: 19,
  discount: 0,
  total_amount: '',
  notes: '',
  status: 'borrador',
  items: [],
};

const emptySaleForm = {
  client_name: '',
  description: '',
  total_amount: '',
  payment_method: 'efectivo',
  observations: '',
};

export default function Quotes() {
  const { addToast } = useAppData();
  const [search, setSearch] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [activeTab, setActiveTab] = useState('quotes'); // 'quotes' or 'sales'
  const [sales, setSales] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [loadingSales, setLoadingSales] = useState(false);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financialAPI.quotes({ limit: 200 }).catch(() => ({ data: [] }));
      setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch {
      addToast('Error cargando cotizaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadClients = async () => {
    try {
      const res = await clientsAPI.list({ limit: 200 }).catch(() => ({ data: [] }));
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const loadSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const res = await financialAPI.sales({ limit: 200 }).catch(() => ({ data: [] }));
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch {
      addToast('Error cargando ventas', 'error');
    } finally {
      setLoadingSales(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadQuotes();
    loadClients();
    loadSales();
  }, [loadQuotes, loadSales]);

  const list = quotes.filter(q =>
    !search || (q.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.quote_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.client_name || q.client || (clients.find(c => c.id === q.client_id)?.company_name) || '').toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    total: list.length,
    value: list.reduce((a,b) => a + (Number(b.total_amount || b.total) || 0), 0),
    approved: list.filter(q => (q.status || '') === 'aprobada').length,
    pending: list.filter(q => ['pendiente','enviada','borrador'].includes(q.status || '')).length,
  };

  const salesList = sales.filter(s =>
    !search || (s.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.sale_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const salesTotals = {
    total: salesList.length,
    value: salesList.reduce((a,b) => a + (Number(b.total_amount) || 0), 0),
  };

  const openNew = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.client_id) payload.client_id = Number(payload.client_id);
      if (payload.subtotal !== '') payload.subtotal = Number(payload.subtotal);
      if (payload.tax !== '') payload.tax = Number(payload.tax);
      if (payload.discount !== '') payload.discount = Number(payload.discount);
      
      payload.total = Number(payload.total_amount);
      delete payload.total_amount;
      
      // La base de datos requiere fecha de creación
      payload.date = new Date().toISOString().split('T')[0];
      
      const res = await financialAPI.createQuote(payload);
      addToast('Cotización creada', 'success');
      setShowModal(false);
      loadQuotes();
      
      // Auto-open PDF
      if (res.data && res.data.id) {
        handlePdfAction(res.data, 'open');
      }
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error guardando cotización', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePdfAction = async (q, action = 'download') => {
    try {
      addToast(action === 'download' ? 'Descargando...' : 'Generando PDF...', 'info');
      const res = await api.get(`/quotes/${q.id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Cotizacion_${q.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      addToast('Error al generar PDF', 'error');
    }
  };

  const handleWhatsApp = (q) => {
    const total = formatCurrency(Number(q.total_amount || q.total) || 0);
    const msg = `Hola, te envío la cotización *COT-${q.id}* por un valor de *${total}*. Puedes revisarla aquí o solicitar el PDF.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    
    const subtotal = newItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
    const tax = Number(form.tax) || 0;
    const discount = Number(form.discount) || 0;
    const ival = subtotal * tax / 100;
    const disc = subtotal * discount / 100;
    
    setForm({ ...form, items: newItems, subtotal, total_amount: subtotal + ival - disc });
  };

  const handleRemoveItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
    const tax = Number(form.tax) || 0;
    const discount = Number(form.discount) || 0;
    const ival = subtotal * tax / 100;
    const disc = subtotal * discount / 100;
    
    setForm({ ...form, items: newItems, subtotal, total_amount: subtotal + ival - disc });
  };

  const handleApprove = async (q) => {
    const convert = window.confirm('¿Aprobar cotización?\n\n¿Desea convertirla automáticamente en una Venta Directa?\nAceptar = Convertir a Venta\nCancelar = Solo aprobar');
    setProcessingId(q.id);
    try {
      await financialAPI.approveQuote(q.id, convert);
      addToast(convert ? 'Cotización aprobada y convertida a Venta Directa' : 'Cotización aprobada', 'success');
      loadQuotes();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error al aprobar', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (q) => {
    if (!window.confirm('¿Rechazar y eliminar esta cotización permanentemente?')) return;
    setProcessingId(q.id);
    try {
      await financialAPI.rejectQuote(q.id);
      addToast('Cotización rechazada y eliminada', 'success');
      loadQuotes();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error al rechazar', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cotización permanentemente?')) return;
    setProcessingId(q.id);
    try {
      await financialAPI.removeQuote(q.id);
      addToast('Cotización eliminada correctamente', 'success');
      loadQuotes();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error al eliminar', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteSale = async (s) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta directa permanentemente? También se eliminará del registro financiero.')) return;
    try {
      await financialAPI.removeSale(s.id);
      addToast('Venta eliminada correctamente', 'success');
      loadSales();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Error al eliminar la venta', 'error');
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...saleForm, total_amount: Number(saleForm.total_amount) };
      const res = await financialAPI.createSale(payload);
      addToast('Venta registrada', 'success');
      setShowSaleModal(false);
      loadSales();
      if (res.data && res.data.id) {
        handleSalePdfAction(res.data, 'open');
      }
    } catch (err) {
      addToast('Error registrando venta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSalePdfAction = async (s, action = 'download') => {
    try {
      addToast(action === 'download' ? 'Descargando...' : 'Generando PDF...', 'info');
      const res = await api.get(`/sales/${s.id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Venta_${s.sale_number}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      addToast('Error al generar PDF de venta', 'error');
    }
  };

  const handleSaleWhatsApp = (s) => {
    const total = formatCurrency(Number(s.total_amount) || 0);
    const msg = `Hola, adjunto el recibo de tu compra *${s.sale_number}* por un valor de *${total}*. Gracias por tu preferencia.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };


  const getClientName = (q) => {
    if (q.client_name) return q.client_name;
    if (q.client) return q.client;
    if (q.client_id) {
      const c = clients.find(c => c.id === q.client_id);
      if (c) return c.company_name || c.contact_person || `Cliente #${q.client_id}`;
    }
    return `Cliente #${q.client_id || '-'}`;
  };

  const getSubtotal = (q) => Number(q.subtotal) || 0;
  const getTaxPercent = (q) => Number(q.tax) ?? 19;
  const getDiscountPercent = (q) => Number(q.discount) ?? 0;
  const getTotal = (q) => Number(q.total_amount || q.total) || 0;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-yellow/15 border border-neon-yellow/30 flex items-center justify-center">
            <FaQuoteLeft size={22} className="text-neon-yellow" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Ventas y Cotizaciones</h2>
            <p className="text-xs text-dark-400">Gestiona tus ventas y genera cotizaciones profesionales con logo, firma y QR</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field !py-2 !pl-8 text-sm w-56" />
          </div>
          <button className="btn-secondary !px-3 !py-2 !text-sm"><FaFileExport size={12} /> Excel</button>
          {activeTab === 'quotes' ? (
            <button className="btn-primary !px-3 !py-2 !text-sm" onClick={openNew}><FaPlus size={12} /> Nueva Cotización</button>
          ) : (
            <button className="btn-primary !px-3 !py-2 !text-sm" onClick={() => { setSaleForm(emptySaleForm); setShowSaleModal(true); }}><FaPlus size={12} /> Nueva Venta</button>
          )}
        </div>
      </motion.div>

      <div className="flex border-b border-dark-600 gap-4 mb-4 px-2">
        <button 
          className={`py-2 px-1 border-b-2 transition-colors ${activeTab === 'quotes' ? 'border-neon-yellow text-neon-yellow font-medium' : 'border-transparent text-dark-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('quotes')}
        >
          Cotizaciones
        </button>
        <button 
          className={`py-2 px-1 border-b-2 transition-colors ${activeTab === 'sales' ? 'border-neon-yellow text-neon-yellow font-medium' : 'border-transparent text-dark-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('sales')}
        >
          Ventas Directas
        </button>
      </div>

      {activeTab === 'quotes' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Total Cotizaciones" value={totals.total} color="primary" />
          <MiniStat label="Valor Total" value={formatCurrency(totals.value)} color="green" />
          <MiniStat label="Aprobadas" value={totals.approved} color="cyan" />
          <MiniStat label="Pendientes" value={totals.pending} color="warning" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Total Ventas" value={salesTotals.total} color="primary" />
          <MiniStat label="Valor Ventas" value={formatCurrency(salesTotals.value)} color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeTab === 'quotes' ? (
          loading && list.length === 0 ? (
            <div className="col-span-full text-center py-12 text-dark-500 text-sm">Cargando cotizaciones...</div>
          ) : list.length === 0 ? (
            <div className="col-span-full text-center py-12 text-dark-500 text-sm">No hay cotizaciones para mostrar</div>
          ) : list.map((q, i) => {
          const subtotal = getSubtotal(q);
          const taxP = getTaxPercent(q);
          const discP = getDiscountPercent(q);
          const total = getTotal(q);
          const ival = subtotal * taxP / 100;
          const disc = subtotal * discP / 100;
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.04 }} className={`card hud-corner hover:scale-[1.01] transition-transform relative overflow-hidden ${processingId === q.id ? 'animate-pulse' : ''}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FaQuoteLeft size={80} className="text-primary-500" />
              </div>
              <div className="relative">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[10px] font-mono text-dark-500 uppercase tracking-wider">{q.quote_number || `COT-${q.id}`}</div>
                    <div className="font-bold text-lg truncate">{q.title}</div>
                  </div>
                  <span className={`${getStatusBadge(q.status)} shrink-0 capitalize`}>{q.status || 'borrador'}</span>
                </div>

                <div className="space-y-1.5 text-xs mb-4 py-3 border-y border-dark-600/40">
                  <Row Ic={FaUserFriends} label="Cliente" value={getClientName(q)} />
                  <Row Ic={FaCalendarAlt} label="Creada" value={formatDate(q.created_at || q.date)} />
                  <Row Ic={FaCalendarAlt} label="Válida hasta" value={formatDate(q.valid_until)} highlight={new Date(q.valid_until) < new Date()} />
                  <Row Ic={FaDollarSign} label="Items" value={`${q.items_count || q.items_count || 0} productos/servicios`} />
                </div>

                <div className="glass rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-xs text-dark-400"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
                  <div className="flex items-center justify-between text-xs text-dark-400"><span>IVA ({taxP}%)</span><span className="font-mono">{formatCurrency(ival)}</span></div>
                  {discP > 0 && <div className="flex items-center justify-between text-xs text-neon-green"><span>Descuento ({discP}%)</span><span className="font-mono">-{formatCurrency(disc)}</span></div>}
                  <div className="divider-gradient my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark-300 uppercase tracking-wider">Total</span>
                    <span className="font-mono font-black text-xl text-neon-green neon-text">{formatCurrency(total || (subtotal + ival - disc))}</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  <ActionBtn Ic={FaEye} label="Ver PDF" onClick={() => handlePdfAction(q, 'open')} />
                  <ActionBtn Ic={FaFilePdf} label="Descargar" onClick={() => handlePdfAction(q, 'download')} />
                  <ActionBtn Ic={FaPrint} label="Imprimir" onClick={() => handlePdfAction(q, 'open')} />
                  <ActionBtn Ic={FaWhatsapp} label="WhatsApp" onClick={() => handleWhatsApp(q)} />
                  <ActionBtn Ic={FaTrash} label="Eliminar" onClick={() => handleDelete(q)} className="!bg-red-500/10 !text-red-500 !border-red-500/30 hover:!bg-red-500 hover:!text-white" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(q.status || '') !== 'aprobada' && (q.status || '') !== 'rechazada' && <button disabled={processingId === q.id} onClick={() => handleApprove(q)} className="btn-success !py-1.5 !text-xs flex items-center justify-center gap-1"><FaCheck size={11} /> Aprobar</button>}
                  {(q.status || '') !== 'aprobada' && (q.status || '') !== 'rechazada' && <button disabled={processingId === q.id} onClick={() => handleReject(q)} className="btn-danger !py-1.5 !text-xs flex items-center justify-center gap-1"><FaTimes size={11} /> Rechazar</button>}
                  {(q.status === 'aprobada' || q.status === 'rechazada') && <div className="col-span-2 text-center text-[11px] py-1.5 text-dark-500 italic">Estado final: {(q.status || '').charAt(0).toUpperCase() + (q.status || '').slice(1)}</div>}
                </div>
              </div>
            </motion.div>
          );
        })
        ) : (
          loadingSales && salesList.length === 0 ? (
            <div className="col-span-full text-center py-12 text-dark-500 text-sm">Cargando ventas...</div>
          ) : salesList.length === 0 ? (
            <div className="col-span-full text-center py-12 text-dark-500 text-sm">No hay ventas para mostrar</div>
          ) : salesList.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.04 }} className={`card hud-corner hover:scale-[1.01] transition-transform relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FaDollarSign size={80} className="text-neon-yellow" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-mono text-dark-500 uppercase tracking-wider">{s.sale_number}</div>
                    <div className="font-bold text-lg truncate">{s.description}</div>
                  </div>
                  <span className="badge badge-success shrink-0 capitalize">{s.payment_method}</span>
                </div>

                <div className="space-y-1.5 text-xs mb-4 py-3 border-y border-dark-600/40">
                  <Row Ic={FaUserFriends} label="Cliente" value={s.client_name || 'General'} />
                  <Row Ic={FaCalendarAlt} label="Fecha" value={formatDate(s.created_at)} />
                </div>

                <div className="glass rounded-xl p-3 mb-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark-300 uppercase tracking-wider">Total Venta</span>
                    <span className="font-mono font-black text-xl text-neon-yellow neon-text">{formatCurrency(s.total_amount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mt-auto">
                  <ActionBtn Ic={FaEye} label="Ver PDF" onClick={() => handleSalePdfAction(s, 'open')} />
                  <ActionBtn Ic={FaFilePdf} label="Descargar" onClick={() => handleSalePdfAction(s, 'download')} />
                  <ActionBtn Ic={FaPrint} label="Imprimir" onClick={() => handleSalePdfAction(s, 'open')} />
                  <ActionBtn Ic={FaWhatsapp} label="WhatsApp" onClick={() => handleSaleWhatsApp(s)} />
                  <ActionBtn Ic={FaTrash} label="Eliminar" onClick={() => handleDeleteSale(s)} className="!bg-red-500/10 !text-red-500 !border-red-500/30 hover:!bg-red-500 hover:!text-white" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-2xl w-[95vw] mx-auto p-6 shadow-glass relative z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold heading-glow mb-1">Nueva Cotización</h3>
            <p className="text-xs text-dark-400 mb-5">Genera una nueva cotización para tu cliente</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Cliente *</label>
                <select required value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="input-field">
                  <option value="">Selecciona un cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.contact_person || `Cliente #${c.id}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Asunto / Título *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Ej: Proyecto robot industrial" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Válida Hasta *</label>
                  <input type="date" required value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="border border-dark-600/40 rounded-xl p-4 bg-dark-800/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-dark-200">Productos / Servicios</h4>
                  <button type="button" onClick={handleAddItem} className="btn-secondary !py-1 !px-2 !text-[10px]"><FaPlus size={10} /> Añadir Item</button>
                </div>
                
                {form.items.length === 0 && <div className="text-center text-xs text-dark-500 py-4">No has agregado items a esta cotización</div>}
                
                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                      <input required value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="input-field flex-1" placeholder="Descripción del producto o servicio..." />
                      <div className="flex gap-2 w-full md:w-auto">
                        <input required type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="input-field w-20" placeholder="Cant." title="Cantidad" />
                        <input required type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} className="input-field w-32" placeholder="Precio Und." title="Precio Unitario" />
                        <div className="w-32 px-3 py-2 bg-dark-900 rounded-lg border border-dark-700 text-right font-mono text-sm">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"><FaTrash size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Subtotal *</label>
                  <input type="number" min="0" step="0.01" required value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">IVA (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} className="input-field" placeholder="19" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Desc. (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Total *</label>
                  <input type="number" min="0" step="0.01" required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} className="input-field" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Notas</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field min-h-[80px]" placeholder="Condiciones, términos, observaciones..." />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Crear Cotización'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowSaleModal(false)} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass rounded-3xl max-w-lg w-[95vw] mx-auto p-6 shadow-glass relative z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold heading-glow mb-1">Nueva Venta Directa</h3>
            <p className="text-xs text-dark-400 mb-5">Registra una nueva venta sin afectar el inventario.</p>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Concepto de la Venta *</label>
                <input required value={saleForm.description} onChange={e => setSaleForm({ ...saleForm, description: e.target.value })} className="input-field" placeholder="Ej: Reparación de robot, servicio técnico..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Valor Total *</label>
                  <input type="number" min="0" step="0.01" required value={saleForm.total_amount} onChange={e => setSaleForm({ ...saleForm, total_amount: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Método de Pago</label>
                  <select value={saleForm.payment_method} onChange={e => setSaleForm({ ...saleForm, payment_method: e.target.value })} className="input-field">
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Cliente (Opcional)</label>
                <input value={saleForm.client_name} onChange={e => setSaleForm({ ...saleForm, client_name: e.target.value })} className="input-field" placeholder="Nombre del cliente o dejar en blanco" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Observaciones</label>
                <textarea value={saleForm.observations} onChange={e => setSaleForm({ ...saleForm, observations: e.target.value })} className="input-field min-h-[60px]" placeholder="Detalles extra, garantía..." />
              </div>
              <div className="flex gap-2 pt-3 border-t border-dark-600/40 justify-end">
                <button type="button" onClick={() => setShowSaleModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Registrar Venta'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
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

function ActionBtn({ Ic, label, onClick, className }) {
  return (
    <button onClick={onClick} className={cn("py-2 rounded-lg text-[10px] bg-dark-700/60 hover:bg-primary-600/20 hover:text-primary-300 text-dark-300 border border-dark-600 hover:border-primary-500/40 transition flex flex-col items-center gap-1", className)}>
      <Ic size={13} />
      {label}
    </button>
  );
}

function MiniStat({ label, value, color }) {
  const c = { primary: 'from-primary-500/20 border-primary-500/30 text-primary-300', green: 'from-neon-green/20 border-neon-green/30 text-neon-green', cyan: 'from-neon-blue/20 border-neon-blue/30 text-neon-blue', warning: 'from-neon-yellow/20 border-neon-yellow/30 text-neon-yellow' }[color] || 'from-primary-500/20 border-primary-500/30 text-primary-300';
  return <div className={`rounded-2xl p-4 border bg-gradient-to-br ${c}`}><div className="text-xs text-dark-300 font-semibold mb-1">{label}</div><div className="text-xl font-black truncate">{value}</div></div>;
}
