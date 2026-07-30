import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaCogs, FaChartLine, FaLightbulb, FaMicrochip, FaBrain, FaMarkdown } from 'react-icons/fa';
import { useAppData } from '../context/AppDataContext';
import { aiAPI } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const quickPrompts = [
  { icon: FaChartLine, text: 'Resumen de productividad del mes', color: 'text-primary-400' },
  { icon: FaLightbulb, text: 'Sugerencias para mejorar el rendimiento', color: 'text-neon-yellow' },
  { icon: FaMicrochip, text: '¿Qué materiales están bajos en inventario?', color: 'text-neon-green' },
  { icon: FaCogs, text: 'Generar cronograma automático', color: 'text-neon-purple' },
];

export default function AIAssistant() {
  const { aiOpen, setAiOpen, addToast } = useAppData();
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente inteligente avanzado de RAFA ROBOTICA v2.0 🤖. Puedo analizar datos, gestionar tareas, verificar el inventario y generar reportes. ¿En qué te ayudo hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const prompt = text.trim();
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiAPI.chat(prompt);
      const msg = res?.data || {};
      
      // Add empty message for streaming
      setMessages(m => [...m, { role: 'assistant', content: '', suggestions: msg.suggestions || [] }]);
      
      // Simulate typing streaming
      const fullContent = msg.response || "No pude procesar tu solicitud en este momento. Por favor, intenta de nuevo.";
      let currentContent = '';
      
      for (let i = 0; i < fullContent.length; i++) {
        await new Promise(r => setTimeout(r, 10)); // 10ms per char
        currentContent += fullContent[i];
        setMessages(m => {
          const newM = [...m];
          newM[newM.length - 1].content = currentContent;
          return newM;
        });
      }
      
    } catch (e) {
      console.error(e);
      addToast('Error del asistente IA', 'error');
      setMessages(m => [...m, { role: 'assistant', content: `Lo siento, ocurrió un error al comunicarme con el servidor. ⚠️ Detalles: ${e.message} ${e.response?.data?.detail || ''}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {aiOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAiOpen(false)}
            className="fixed inset-0 bg-dark-950/70 backdrop-blur-md z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50 w-full md:w-[750px] lg:w-[850px] xl:w-[950px] h-[100dvh] md:h-[92vh] max-h-[1000px] flex flex-col bg-dark-950/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl border-t md:border border-primary-500/30 shadow-[0_0_40px_rgba(0,194,255,0.15)] overflow-hidden hud-corner"
          >
            <div className="p-4 border-b border-dark-600/60 flex items-center gap-3 bg-gradient-to-r from-primary-600/20 via-dark-800 to-neon-green/10">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 via-neon-blue to-neon-green flex items-center justify-center animate-glow">
                  <FaBrain size={22} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-green border-2 border-dark-800 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2">
                  Asistente IA
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30 font-semibold">
                    BETA
                  </span>
                </div>
                <div className="text-xs text-dark-400 flex items-center gap-1.5">
                  <FaCogs size={10} className="text-neon-yellow" />
                  Listo para ayudarte con tu laboratorio
                </div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-dark-700/60 text-dark-300 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-primary-600 to-primary-500'
                      : 'bg-gradient-to-br from-emerald-600 to-neon-green'
                  }`}>
                    {m.role === 'user' ? 'U' : <FaRobot size={14} className="text-dark-950" />}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary-600/25 border border-primary-500/30 text-white'
                      : 'bg-dark-700/60 border border-dark-600/60 text-dark-100 markdown-body'
                  }`}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                        code: ({node, inline, ...props}) => inline ? <code className="bg-dark-900/50 text-neon-yellow px-1 py-0.5 rounded font-mono text-xs" {...props} /> : <code className="block bg-dark-900/80 p-2 rounded my-2 font-mono text-xs overflow-x-auto" {...props} />,
                      }}>
                        {m.content}
                      </ReactMarkdown>
                    )}
                    {m.suggestions && m.content.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dark-600/50 flex flex-wrap gap-1.5">
                        {m.suggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => sendMessage(s)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-dark-800 hover:bg-primary-600/20 hover:text-primary-300 border border-dark-600 hover:border-primary-500/40 text-dark-300 transition"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-br from-emerald-600 to-neon-green flex items-center justify-center">
                    <FaRobot size={14} className="text-dark-950" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-dark-700/60 border border-dark-600/60">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-neon-green animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-neon-green animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-neon-green animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-3 border-t border-dark-600/60 space-y-2 bg-dark-800/40">
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(p.text)}
                      className="text-[11px] px-2.5 py-1.5 rounded-xl bg-dark-700/70 hover:bg-primary-600/20 border border-dark-600 hover:border-primary-500/40 text-dark-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Icon size={11} className={p.color} />
                      {p.text}
                    </button>
                  );
                })}
              </div>
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Pregúntame lo que necesites..."
                  className="input-field !py-2.5 text-sm flex-1"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-primary !px-3 !py-2.5 !rounded-xl disabled:opacity-40"
                >
                  <FaPaperPlane size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
