import React from 'react';

interface AvatarProps {
  src: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSpeaking?: boolean;
  className?: string;
  status?: 'online' | 'in-call' | 'offline';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isSpeaking = false,
  className = '',
  status
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-3xl',
  };

  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    'in-call': 'bg-accent-cyan',
    offline: 'bg-slate-500',
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 ${className}`}>
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover bg-background-surface transition-all duration-200 ${sizeClasses[size]} ${
          isSpeaking ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background-darkest animate-speaking-pulse' : ''
        }`}
        onError={(e) => {
          // Fallback se o avatar da internet falhar
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-background-darkest ${statusSize[size]} ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
