import React from 'react';
import { Volume2, Menu, Users, Settings } from 'lucide-react';
import { useVoice } from '../context/VoiceContext.js';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleUsers: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onToggleUsers,
  onOpenSettings,
}) => {
  const { currentChannel } = useVoice();

  return (
    <header className="h-14 bg-background-card border-b border-background-border flex items-center justify-between px-4 z-30 lg:hidden">
      {/* Botão Hambúrguer para abrir Sidebar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-background-surface transition-colors"
          aria-label="Abrir Menu de Canais"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-100">
            {currentChannel ? currentChannel.name : 'Nexus Voice'}
          </span>
        </div>
      </div>

      {/* Ações da Direita */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-background-surface transition-colors"
          aria-label="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleUsers}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-background-surface transition-colors"
          aria-label="Ver Participantes"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
