import { cn, getInitials, getAvatarGradient } from '../../lib/utils';

export default function Avatar({ name = '', src, id = 0, size = 'md', className, online }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };
  return (
    <div className={cn('relative inline-flex', className)}>
      <div className={cn(
        'rounded-xl flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0',
        sizes[size],
        !src && `bg-gradient-to-br ${getAvatarGradient(id)} shadow-md`
      )}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {online !== undefined && (
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800',
          online ? 'bg-neon-green shadow-[0_0_8px_rgba(0,255,136,0.7)]' : 'bg-dark-500'
        )} />
      )}
    </div>
  );
}
