import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'admin' | 'user' | 'live' | 'speaking' | 'muted';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'user', className = '' }) => {
  const variants = {
    admin: 'bg-brand-500/15 text-brand-400 border-brand-500/30 shadow-sm',
    user: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    live: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
    speaking: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    muted: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
