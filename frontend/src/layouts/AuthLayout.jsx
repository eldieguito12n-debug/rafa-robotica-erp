import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FaRobot, FaMicrochip, FaCogs, FaNetworkWired } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const [floatOffset, setFloatOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatOffset(prev => prev + 0.02);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary-500/60"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              boxShadow: '0 0 10px rgba(0, 102, 255, 0.8)',
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      <div className="absolute top-10 left-10 animate-float opacity-70 hidden lg:block">
        <FaRobot size={50} className="text-primary-500" />
      </div>
      <div className="absolute top-20 right-16 animate-float opacity-60 hidden lg:block" style={{ animationDelay: '1s' }}>
        <FaMicrochip size={45} className="text-neon-green" />
      </div>
      <div className="absolute bottom-20 left-20 animate-float opacity-50 hidden lg:block" style={{ animationDelay: '0.5s' }}>
        <FaCogs size={40} className="text-neon-blue" />
      </div>
      <div className="absolute bottom-16 right-24 animate-float opacity-60 hidden lg:block" style={{ animationDelay: '1.5s' }}>
        <FaNetworkWired size={48} className="text-neon-purple" />
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col gap-6 pr-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-neon-green flex items-center justify-center shadow-glow-blue">
              <FaRobot size={30} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black heading-glow">RoboLab ERP</h1>
              <p className="text-sm text-dark-400">Sistema Inteligente de Laboratorio</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight text-balance">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-neon-blue to-neon-green">
              Automatiza
            </span>{' '}
            tu laboratorio de robótica e innovación.
          </h2>

          <p className="text-dark-300 text-lg leading-relaxed">
            Gestiona proyectos, inventario, equipo, finanzas y colaboradores en una única plataforma futurista, segura y en tiempo real.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { n: '+99%', l: 'Precisión' },
              { n: '24/7', l: 'Monitoreo' },
              { n: '10x', l: 'Velocidad' },
            ].map((x, i) => (
              <div key={i} className="glass rounded-xl p-4 hud-corner">
                <div className="text-2xl font-black text-neon-green neon-text">{x.n}</div>
                <div className="text-xs text-dark-400 mt-1">{x.l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
