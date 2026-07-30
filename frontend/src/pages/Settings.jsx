import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaBuilding, FaBell, FaShieldAlt, FaSave, FaHistory } from 'react-icons/fa';
import { useAppData } from '../context/AppDataContext';
import { settingsAPI } from '../lib/api';
import { cn, formatDate, timeAgo } from '../lib/utils';
import Avatar from '../components/ui/Avatar.jsx';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { addToast } = useAppData();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({ company_name: '', app_name: '', notifications_enabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data);
    } catch {
      addToast('Error cargando ajustes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await settingsAPI.logs(30);
      setLogs(res.data);
    } catch {
      addToast('Error cargando historial de actividad', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      addToast('Ajustes guardados correctamente', 'success');
    } catch {
      addToast('Error al guardar ajustes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaBuilding },
    { id: 'logs', label: 'Actividad', icon: FaHistory },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
            <FaCog size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Ajustes del Sistema</h2>
            <p className="text-xs text-dark-400">Configuración general y registro de actividad</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm',
                  active ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-glow-blue' : 'hover:bg-dark-700/50 text-dark-300 hover:text-white border border-transparent'
                )}
              >
                <Icon size={14} className={active ? 'text-primary-400' : 'text-dark-500'} />
                {t.label}
              </button>
            );
          })}
          
          <div className="mt-8 pt-4 border-t border-dark-600/50">
             <Link to="/users" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm hover:bg-dark-700/50 text-dark-300 hover:text-white border border-transparent">
               <FaShieldAlt size={14} className="text-dark-500" />
               Ir a Gestión de Usuarios
             </Link>
          </div>
        </div>

        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <form onSubmit={handleSave} className="card space-y-5">
                  <h3 className="font-bold text-lg mb-4">Configuración General</h3>
                  {loading ? (
                    <div className="h-32 flex items-center justify-center animate-pulse">Cargando...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Nombre de la Empresa</label>
                          <input 
                            value={settings.company_name || ''} 
                            onChange={e => setSettings({...settings, company_name: e.target.value})} 
                            className="input-field" 
                            placeholder="Ej. RoboLab Inc." 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Nombre de la Aplicación</label>
                          <input 
                            value={settings.app_name || ''} 
                            onChange={e => setSettings({...settings, app_name: e.target.value})} 
                            className="input-field" 
                            placeholder="Ej. RoboLab ERP" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-700/30 border border-dark-600/40 mt-4">
                        <input 
                          type="checkbox" 
                          id="notif_global" 
                          checked={settings.notifications_enabled} 
                          onChange={e => setSettings({...settings, notifications_enabled: e.target.checked})} 
                          className="w-4 h-4 accent-primary-500" 
                        />
                        <div className="flex-1">
                          <label htmlFor="notif_global" className="text-sm text-dark-200 font-medium cursor-pointer block">Habilitar Notificaciones Globales</label>
                          <span className="text-xs text-dark-400">Permite que el sistema envíe notificaciones push y alertas.</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-dark-600/50 flex justify-end">
                        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                          <FaSave size={12} />
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="card space-y-4 !p-0 overflow-hidden">
                  <div className="p-5 border-b border-dark-600/50">
                    <h3 className="font-bold text-lg">Registro de Actividad</h3>
                    <p className="text-xs text-dark-400">Últimos eventos importantes en el sistema</p>
                  </div>
                  
                  {loadingLogs ? (
                    <div className="p-8 text-center text-dark-400 animate-pulse">Cargando registros...</div>
                  ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-dark-500 text-sm">No hay registros recientes</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-dark-800/50 text-dark-400 text-xs uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="px-5 py-3">Usuario</th>
                            <th className="px-5 py-3">Acción</th>
                            <th className="px-5 py-3">Entidad</th>
                            <th className="px-5 py-3">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700/50">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-dark-800/30 transition">
                              <td className="px-5 py-3">
                                {log.user ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar name={log.user.full_name} id={log.user.id} size="xs" />
                                    <span className="font-medium text-dark-200">{log.user.full_name}</span>
                                  </div>
                                ) : (
                                  <span className="text-dark-500 italic">Sistema</span>
                                )}
                              </td>
                              <td className="px-5 py-3 font-mono text-xs text-primary-300">{log.action}</td>
                              <td className="px-5 py-3 text-dark-300">
                                {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                              </td>
                              <td className="px-5 py-3 text-dark-400 text-xs">
                                {timeAgo(log.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
