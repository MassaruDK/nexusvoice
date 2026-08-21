import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { ChannelList } from '../features/channels/ChannelList.js';
import { UserProfileBar } from '../features/ui/UserProfileBar.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenSettings }) => {
  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background-darkest/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-background-card border-r border-background-border flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-14 px-4 border-b border-background-border/80 flex items-center justify-between flex-shrink-0 bg-background-darkest/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-glow-brand">
              <div className="w-full h-full bg-background-card rounded-[10px] flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">Nexus</span>
              <span className="font-extrabold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-cyan"> Voice</span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> v1.0
          </span>
        </div>

        {/* Lista de Canais */}
        <ChannelList />

        {/* Perfil do Usuário na Base da Sidebar */}
        <UserProfileBar onOpenSettings={onOpenSettings} />
      </aside>
    </>
  );
};
