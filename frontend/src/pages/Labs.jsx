import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaFlask, FaPlus, FaSearch, FaEdit, FaCogs, FaUsers, FaMapMarkerAlt, FaSignal, FaCog, FaCircle } from 'react-icons/fa';
import { labsAPI } from '../lib/api';
import { cn } from '../lib/utils';

const mockLabs = [
  { id: 1, name: 'Laboratorio IoT', code: 'LAB-IOT-01', location: 'Edificio A · Piso 1', description: 'Laboratorio equipado para desarrollo de dispositivos IoT, con sensores ambientales, gateway LoRa y bancos de prueba para dispositivos embebidos.', status: 'operativo', capacity: 12, equipment: ['Raspberry Pi 4 (x10)','ESP32 Dev Kits (x20)','Sensores varios','Osciloscopios (x2)','Fuentes de poder (x5)'] },
  { id: 2, name: 'Laboratorio de Electrónica', code: 'LAB-ELEC-01', location: 'Edificio A · Piso 2', description: 'Zona para diseño y fabricación de PCB, soldadura SMD/THT, bancos de medición y equipos de calibración.', status: 'operativo', capacity: 8, equipment: ['Máquina de soldado reflow','Horno de curado','Osciloscopios (x5)','Generadores (x3)','Analizador LCR'] },
  { id: 3, name: 'Laboratorio de Robótica', code: 'LAB-ROB-01', location: 'Edificio B · Piso 1', description: 'Espacio con pistas para robots móviles, brazos robóticos industriales, drones y sistemas de visión artificial.', status: 'operativo', capacity: 15, equipment: ['Brazo UR3e','Brazo Dobot Magician','Pista móvil 5x10m','Drones DJI Tello (x6)','Cámaras ZED (x2)'] },
  { id: 4, name: 'Laboratorio CAD 3D', code: 'LAB-CAD-01', location: 'Edificio B · Piso 2', description: 'Estaciones de alto rendimiento para diseño CAD/CAM, renderizado 3D y simulación de ensambles mecánicos.', status: 'mantenimiento', capacity: 8, equipment: ['Workstations (x10) RTX 4090','Licencias SolidWorks Pro','Fusion 360','Ansys','Mastercam'] },
  { id: 5, name: 'Taller Impresión 3D', code: 'LAB-3D-01', location: 'Edificio C', description: 'Parque de impresoras 3D FDM y SLA, estación de post-procesado y curado UV para prototipado rápido.', status: 'disponible', capacity: 6, equipment: ['Prusa MK4 (x6)','Bambu X1 Carbon (x4)','Formlabs 3+','Cámara de curado UV','Estación lijado/pintura'] },
  { id: 6, name: 'Sala de IA & Visión', code: 'LAB-AI-01', location: 'Edificio B · Piso 3', description: 'GPUs para entrenamiento modelos, cámaras de alta velocidad y setup de robótica con reinforcement learning.', status: 'ocupado', capacity: 4, equipment: ['Servidor 8x H100','Cámaras 4K 240fps','Estaciones ML','Dataset storage 200TB'] },
];

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try { const r = await labsAPI.list(); setLabs(r.data); } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const list = (labs.length ? labs : mockLabs).filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusMap = {
    operativo: { color: 'neon-green', label: 'Operativo', desc: 'En funcionamiento normal' },
    disponible: { color: 'primary-400', label: 'Disponible', desc: 'Libre para reservar' },
    ocupado: { color: 'neon-blue', label: 'Ocupado', desc: 'En uso actualmente' },
    mantenimiento: { color: 'neon-yellow', label: 'Mantenimiento', desc: 'Temporalmente fuera de servicio' },
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
            <FaFlask size={22} className="text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Estado de Laboratorios</h2>
            <p className="text-xs text-dark-400">Monitorea disponibilidad, capacidad y equipos de cada espacio</p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar laboratorio..." className="input-field !py-2 !pl-8 text-sm w-56"/></div>
          <button className="btn-primary !px-3 !py-2 !text-sm"><FaPlus size={12}/> Nuevo</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(statusMap).map(([k, v]) => {
          const n = list.filter(l => l.status === k).length;
          return (
            <div key={k} className="card !p-4 flex items-center gap-3">
              <div className="relative">
                <FaCircle size={30} className={`text-${v.color} opacity-20`}/>
                <FaCircle size={14} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-${v.color}`}/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider font-bold text-dark-400">{v.label}</div>
                <div className="text-2xl font-black">{n}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((lab, i) => {
          const s = statusMap[lab.status] || statusMap.operativo;
          return (
            <motion.div
              key={lab.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i*0.05 }}
              className="card hud-corner overflow-hidden hover:shadow-glow-blue transition-all group relative"
            >
              <div className="h-32 relative mb-4 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 rounded-xl overflow-hidden border border-dark-600/50">
                <div className="absolute inset-0 grid-bg opacity-50" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={cn('text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border flex items-center gap-1.5',
                    lab.status === 'operativo' ? 'bg-neon-green/15 text-neon-green border-neon-green/40' :
                    lab.status === 'disponible' ? 'bg-primary-500/15 text-primary-300 border-primary-500/40' :
                    lab.status === 'mantenimiento' ? 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/40 animate-pulse-slow' :
                    'bg-neon-blue/15 text-neon-blue border-neon-blue/40'
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full current-bg-current" style={{background: 'currentColor'}}/>{s.label}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div className="text-[10px] font-mono text-dark-400 bg-dark-900/60 px-2 py-1 rounded backdrop-blur border border-dark-700/50">{lab.code}</div>
                  <div className="text-[10px] px-2 py-1 rounded bg-dark-900/60 backdrop-blur border border-dark-700/50 text-dark-300 flex items-center gap-1.5"><FaUsers size={9}/>Cap. {lab.capacity}</div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-dark-900/80 to-transparent" />
              </div>

              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-xl leading-tight">{lab.name}</h3>
                  <div className="text-xs text-dark-400 flex items-center gap-1.5 mt-1"><FaMapMarkerAlt size={9}/>{lab.location || 'Ubicación no especificada'}</div>
                </div>
                <button className="w-9 h-9 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-primary-300 flex items-center justify-center"><FaEdit size={13}/></button>
              </div>
              <p className="text-xs text-dark-300 leading-relaxed min-h-[48px] mb-4 line-clamp-3">{lab.description}</p>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider font-bold text-dark-400 mb-2 flex items-center gap-1.5"><FaCogs size={10}/> Equipamiento ({(lab.equipment || []).length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {(lab.equipment || ['Equipo A','Equipo B','Equipo C']).slice(0, 4).map(eq => (
                    <span key={eq} className="text-[10px] px-2 py-1 rounded-md bg-dark-700/60 border border-dark-600/40 text-dark-300 line-clamp-1 max-w-full">{eq}</span>
                  ))}
                  {(lab.equipment || []).length > 4 && <span className="text-[10px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-300 border border-primary-500/30 font-bold">+{(lab.equipment||[]).length - 4} más</span>}
                </div>
              </div>

              <div className="flex gap-2 border-t border-dark-600/40 pt-3">
                <button className="btn-secondary !py-2 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaSignal size={10}/> Detalles</button>
                <button className="btn-primary !py-2 !text-xs flex-1 flex items-center justify-center gap-1.5"><FaCog size={10}/> Reservar</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
