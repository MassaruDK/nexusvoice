import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, duration = 4000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      border: 'border-emerald-500/30',
      bg: 'bg-background-card/95',
      glow: 'shadow-glow-emerald',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
      border: 'border-rose-500/30',
      bg: 'bg-background-card/95',
      glow: 'shadow-glow-rose',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      border: 'border-amber-500/30',
      bg: 'bg-background-card/95',
      glow: 'shadow-lg shadow-amber-500/10',
    },
    info: {
      icon: <Info className="w-5 h-5 text-brand-400" />,
      border: 'border-brand-500/30',
      bg: 'bg-background-card/95',
      glow: 'shadow-glow-brand',
    },
  };

  const current = config[type];

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-300 animate-slide-up ${current.bg} ${current.border} ${current.glow}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
      <div className="flex-1 text-sm text-slate-200 leading-snug">{message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
