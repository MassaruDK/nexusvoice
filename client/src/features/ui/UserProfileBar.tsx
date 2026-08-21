import React from 'react';
import { Mic, MicOff, Headphones, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useVoice } from '../../context/VoiceContext.js';
import { Avatar } from './Avatar.js';
import { Badge } from './Badge.js';
import { Tooltip } from './Tooltip.js';

interface UserProfileBarProps {
  onOpenSettings: () => void;
}

export const UserProfileBar: React.FC<UserProfileBarProps> = ({ onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { isJoined, isMuted, isDeafened, toggleMic, toggleDeafen } = useVoice();

  if (!user) return null;

  return (
    <div className="p-3 border-t border-background-border bg-background-card/90 backdrop-blur flex items-center justify-between gap-2">
      {/* Dados do Usuário */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar
          src={user.avatar}
          name={user.username}
          size="md"
          status={isJoined ? 'in-call' : 'online'}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-100 truncate">{user.username}</span>
            {user.role === 'ADMIN' && <Badge variant="admin">ADMIN</Badge>}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {isJoined ? 'Em chamada' : 'Disponível'}
          </p>
        </div>
      </div>

      {/* Botões Rápidos */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Tooltip content={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}>
          <button
            onClick={toggleMic}
            className={`p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'text-slate-300 hover:text-white hover:bg-background-surface'
            }`}
            aria-label={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </Tooltip>

        <Tooltip content={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer Áudio'}>
          <button
            onClick={toggleDeafen}
            className={`p-2 rounded-lg transition-colors ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'text-slate-300 hover:text-white hover:bg-background-surface'
            }`}
            aria-label={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer Áudio'}
          >
            <Headphones className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Configurações de Áudio e Vídeo">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-background-surface transition-colors"
            aria-label="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Sair da Conta">
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-background-surface transition-colors"
            aria-label="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
