import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaComments, FaSearch, FaPaperPlane, FaPaperclip, FaImage, FaCode,
  FaSmile, FaPhone, FaVideo, FaEllipsisV, FaCheck, FaCheckDouble,
} from 'react-icons/fa';
import Avatar from '../components/ui/Avatar.jsx';
import { cn, formatDateTime, timeAgo } from '../lib/utils';

const conversations = [
  { id: 2, name: 'Laura Martínez', role: 'Jefe de Desarrollo', last: 'Perfecto, reviso el PR en la tarde', time: 'hace 2m', unread: 3, online: true, msgs: [
    { id: 1, text: 'Buenos días! ¿Cómo va el diseño del chasis?', sent: false, time: '08:15' },
    { id: 2, text: '¡Hola Laura! Muy bien, ya lo tengo listo en Fusion 360. Te paso el link 👇', sent: true, time: '08:20', read: true },
    { id: 3, text: 'Genial. Fíjate que necesito agujeros para los ventiladores adicionales', sent: false, time: '08:22' },
    { id: 4, text: 'Entendido, actualizo el modelo y te aviso', sent: true, time: '08:25', read: true },
    { id: 5, text: 'Perfecto, reviso el PR en la tarde', sent: false, time: '08:30' },
  ]},
  { id: 4, name: 'Diana Torres', role: 'Ingeniera Electrónica', last: 'Envió código PCB_v3.kicad_sch', time: 'hace 15m', unread: 1, online: true, msgs: [
    { id: 1, text: 'Revisé el PCB. Cambié el regulador por uno más eficiente', sent: false, time: '09:00' },
    { id: 2, text: 'Excelente, cuál es eficiencia ahora?', sent: true, time: '09:05', read: true },
    { id: 3, text: 'Pasamos de 78% a 91%', sent: false, time: '09:06' },
  ]},
  { id: 3, name: 'Carlos Vega', role: 'Programador Senior', last: 'Listo el container con ROS2 Humble', time: 'hace 1h', unread: 0, online: true, msgs: [
    { id: 1, text: 'Container Docker con ROS2 listo ✅', sent: false, time: '07:00' },
  ]},
  { id: 5, name: 'Esteban López', role: 'Diseñador CAD', last: 'Imágenes renders del robot', time: 'hace 3h', unread: 0, online: false, msgs: [] },
  { id: 6, name: 'Fernanda Gómez', role: 'Técnica de Laboratorio', last: 'Calibración de motores OK', time: 'hace 5h', unread: 0, online: false, msgs: [] },
  { id: 1, name: 'Admin RoboLab', role: 'Sistema', last: 'Recordatorio: Reunión 3pm', time: 'ayer', unread: 0, online: true, msgs: [] },
  { id: 7, name: 'Cliente Demo - TechCorp', role: 'Cliente', last: 'Gracias por el informe!', time: 'ayer', unread: 2, online: false, msgs: [] },
];

export default function Chat() {
  const [activeId, setActiveId] = useState(2);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);
  const active = conversations.find(c => c.id === activeId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeId, active?.msgs.length]);

  const send = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    active.msgs.push({ id: Date.now(), text: input.trim(), sent: true, time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), read: false });
    setInput('');
    setTimeout(() => {
      active.msgs.push({
        id: Date.now() + 1,
        text: 'Perfecto, en un momento te respondo con los detalles 👍',
        sent: false,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      });
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 1200);
  };

  const list = conversations.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 h-[calc(100vh-180px)] min-h-[600px] flex flex-col">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5 flex flex-col md:flex-row md:items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
            <FaComments size={22} className="text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold heading-glow">Chat Interno</h2>
            <p className="text-xs text-dark-400">Comunicación en tiempo real del equipo</p>
          </div>
        </div>
        <div className="md:ml-auto w-full md:w-80">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversación..." className="input-field !py-2 !pl-8 text-sm w-full" />
          </div>
        </div>
      </motion.div>

      <div className="flex-1 card hud-corner !p-0 overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr] min-h-0">
        <div className="border-r border-dark-600/50 flex flex-col min-h-0">
          <div className="p-3 border-b border-dark-600/40 text-xs font-bold uppercase tracking-wider text-dark-400 flex items-center justify-between">
            <span>Conversaciones ({list.length})</span>
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-dark-700/40">
            {list.map(c => (
              <button
                key={c.id} onClick={() => setActiveId(c.id)}
                className={cn(
                  'w-full p-3 text-left transition relative flex items-center gap-3',
                  activeId === c.id ? 'bg-primary-500/10 border-l-2 border-primary-500' : 'hover:bg-dark-700/40 border-l-2 border-transparent'
                )}
              >
                <Avatar name={c.name} id={c.id} size="md" online={c.online} />
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-[10px] text-dark-500 font-mono flex-shrink-0">{c.time}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-xs text-dark-400 truncate">{c.last}</div>
                    {c.unread > 0 && (
                      <span className="text-[10px] font-bold bg-gradient-to-br from-primary-600 to-primary-500 rounded-full w-5 h-5 flex items-center justify-center shadow-glow-blue flex-shrink-0 text-white">{c.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          {active ? (
            <>
              <div className="p-4 border-b border-dark-600/40 flex items-center gap-3 flex-shrink-0">
                <Avatar name={active.name} id={active.id} size="md" online={active.online} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{active.name}</div>
                  <div className="text-xs text-dark-400 flex items-center gap-1.5">
                    <span className={cn('w-1.5 h-1.5 rounded-full', active.online ? 'bg-neon-green animate-pulse' : 'bg-dark-500')} />
                    {active.online ? 'En línea' : 'Desconectado'} · {active.role}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-300 hover:text-primary-400 flex items-center justify-center transition" title="Llamada"><FaPhone size={14}/></button>
                  <button className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-300 hover:text-primary-400 flex items-center justify-center transition" title="Video"><FaVideo size={14}/></button>
                  <button className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-300 hover:text-white flex items-center justify-center transition" title="Menú"><FaEllipsisV size={14}/></button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-dark-800/20 to-dark-900/20">
                <AnimatePresence initial={false}>
                  {active.msgs.map(m => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn('flex', m.sent ? 'justify-end' : 'justify-start')}
                    >
                      {!m.sent && <Avatar name={active.name} id={active.id} size="sm" className="mr-2 flex-shrink-0" />}
                      <div className="max-w-[75%]">
                        <div className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg',
                          m.sent
                            ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-br-md shadow-glow-blue'
                            : 'glass rounded-bl-md border border-dark-600/40'
                        )}>
                          {m.text}
                        </div>
                        <div className={cn('flex items-center gap-1 mt-1 text-[10px] text-dark-500 font-mono', m.sent ? 'justify-end' : 'justify-start pl-10')}>
                          {m.time}
                          {m.sent && <span className="text-primary-300 ml-1">{m.read ? <FaCheckDouble size={10}/> : <FaCheck size={10}/>}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <form onSubmit={send} className="p-4 border-t border-dark-600/40 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex gap-1 mb-1">
                    <button type="button" className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-400 hover:text-primary-400 flex items-center justify-center transition" title="Adjuntar"><FaPaperclip size={14}/></button>
                    <button type="button" className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-400 hover:text-neon-green flex items-center justify-center transition" title="Imagen"><FaImage size={14}/></button>
                    <button type="button" className="w-9 h-9 rounded-xl hover:bg-dark-700/60 text-dark-400 hover:text-neon-blue flex items-center justify-center transition" title="Código"><FaCode size={14}/></button>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Escribe un mensaje..."
                      rows={1}
                      className="input-field resize-none !py-3 !pr-12 max-h-32"
                    />
                    <button type="button" className="absolute right-3 bottom-3 text-dark-400 hover:text-neon-yellow transition"><FaSmile size={16}/></button>
                  </div>
                  <button type="submit" disabled={!input.trim()} className="btn-primary !px-4 !py-3 !rounded-xl disabled:opacity-40 flex items-center gap-2">
                    <FaPaperPlane size={14} />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <FaComments size={60} className="mx-auto mb-4 opacity-30 text-primary-400" />
                <p className="text-dark-400">Selecciona una conversación para empezar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
