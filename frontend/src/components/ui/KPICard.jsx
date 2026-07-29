import { motion } from 'framer-motion';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';

export default function KPICard({
  title, value, icon: Icon, color = 'primary',
  trend, trendValue, subtitle, currency = false,
}) {
  const colorMap = {
    primary: { text: 'text-primary-400', bg: 'bg-primary-500/15', border: 'border-primary-500/30', glow: 'shadow-glow-blue' },
    green:   { text: 'text-neon-green', bg: 'bg-neon-green/15', border: 'border-neon-green/30', glow: 'shadow-glow-green' },
    cyan:    { text: 'text-neon-blue', bg: 'bg-neon-blue/15', border: 'border-neon-blue/30', glow: 'shadow-glow-cyan' },
    purple:  { text: 'text-neon-purple', bg: 'bg-neon-purple/15', border: 'border-neon-purple/30' },
    pink:    { text: 'text-neon-pink', bg: 'bg-neon-pink/15', border: 'border-neon-pink/30' },
    yellow:  { text: 'text-neon-yellow', bg: 'bg-neon-yellow/15', border: 'border-neon-yellow/30' },
    red:     { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  };
  const c = colorMap[color] || colorMap.primary;
  const trendPositive = trend === 'up' || trend === true;
  const displayValue = currency ? formatCurrency(value) : formatNumber(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="kpi-card hud-corner scan-line group hover:scale-[1.015] transition-transform duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
            {title}
          </div>
          <motion.div
            key={displayValue}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-3xl md:text-4xl font-black tracking-tight ${c.text} neon-text`}
          >
            {displayValue}
          </motion.div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold',
                trendPositive ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-400'
              )}>
                <span>{trendPositive ? '▲' : '▼'}</span>
                {trendValue || '12%'}
              </span>
            )}
            {subtitle && <span className="text-dark-500">{subtitle}</span>}
          </div>
        </div>
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300',
          c.bg, c.border
        )}>
          {Icon && <Icon size={26} className={c.text} />}
        </div>
      </div>
    </motion.div>
  );
}
