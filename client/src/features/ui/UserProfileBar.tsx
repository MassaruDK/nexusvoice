import React, { useState } from 'react';
import { Mic, MicOff, Headphones, Settings, UserCheck, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useVoice } from '../../context/VoiceContext.js';
import { Avatar } from './Avatar.js';
import { ProfileSettingsModal } from '../profile/ProfileSettingsModal.js';

interface UserProfileBarProps {
  onOpenSettings: () => void;
}

export const UserProfileBar: React.FC<UserProfileBarProps> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const { isMuted, isDeafened, toggleMic, toggleDeafen } = useVoice();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="p-3 bg-background-card/90 border-t border-background-border/80 flex items-center justify-between gap-2 select-none">
        {/* Informações do Usuário (clicável para editar perfil) */}
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2.5 min-w-0 flex-1 p-1 -m-1 rounded-xl hover:bg-background-hover cursor-pointer transition-colors group"
          title="Editar Perfil (Nome, Foto, Bio)"
        >
          <div className="relative flex-shrink-0">
            <Avatar src={user.avatar} name={user.username} size="sm" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background-card" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-slate-100 truncate group-hover:text-brand-300 transition-colors">
                {user.username}
              </p>
              <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {user.bio || (user.role === 'ADMIN' ? 'Administrador' : 'Membro')}
            </p>
          </div>
        </div>

        {/* Controles de Áudio e Configurações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleMic}
            className={`p-1.5 rounded-lg transition-colors ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-background-hover'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded-lg transition-colors ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-background-hover'
            }`}
            title={isDeafened ? 'Desensurdecer' : 'Ensurdecer'}
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-background-hover transition-colors"
            title="Configurações de Dispositivos"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};
