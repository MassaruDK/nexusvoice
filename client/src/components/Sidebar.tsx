import React from 'react';
import { Radio, X } from 'lucide-react';
import { VoiceChannel } from '../types/index.js';
import { ChannelList } from '../features/channels/ChannelList.js';
import { UserProfileBar } from '../features/ui/UserProfileBar.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  selectedTextChannelId: string | null;
  onSelectTextChannel: (channel: VoiceChannel) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  selectedTextChannelId,
  onSelectTextChannel,
}) => {
  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background-card/95 border-r border-background-border/80 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header do Servidor */}
        <div className="h-14 px-4 border-b border-background-border/80 flex items-center justify-between flex-shrink-0 bg-background/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-accent-cyan flex items-center justify-center text-white shadow-md shadow-brand-600/30 flex-shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white truncate tracking-tight">
                Nexus Voice
              </h1>
              <p className="text-[10px] text-brand-400 font-medium truncate">
                Comunidade Ativa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Canais (Texto e Voz) */}
        <ChannelList
          selectedTextChannelId={selectedTextChannelId}
          onSelectTextChannel={(channel) => {
            onSelectTextChannel(channel);
            if (window.innerWidth < 768) onClose();
          }}
        />

        {/* Barra de Perfil no Rodapé */}
        <UserProfileBar onOpenSettings={onOpenSettings} />
      </aside>
    </>
  );
};
