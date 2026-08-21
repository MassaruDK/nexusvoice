import React, { useState } from 'react';
import { VoiceChannel } from '../types/index.js';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { ActiveUsersSidebar } from './ActiveUsersSidebar.js';
import { VoiceRoom } from '../features/voice/VoiceRoom.js';
import { TextChannelRoom } from '../features/chat/TextChannelRoom.js';
import { DeviceSettingsModal } from '../features/settings/DeviceSettingsModal.js';
import { useVoice } from '../context/VoiceContext.js';
import { Hash, Volume2 } from 'lucide-react';

export const Layout: React.FC = () => {
  const { currentChannel: currentVoiceChannel } = useVoice();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUsersSidebarOpen, setIsUsersSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Canal de texto selecionado
  const [selectedTextChannel, setSelectedTextChannel] = useState<VoiceChannel | null>(null);
  const [viewMode, setViewMode] = useState<'TEXT' | 'VOICE'>('TEXT');

  return (
    <div className="flex flex-col h-screen w-screen bg-background-darkest overflow-hidden">
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleUsers={() => setIsUsersSidebarOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerda */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          selectedTextChannelId={selectedTextChannel?.id || null}
          onSelectTextChannel={(channel) => {
            setSelectedTextChannel(channel);
            setViewMode('TEXT');
          }}
        />

        {/* Área Central Principal */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Seletor rápido de visualização quando em chamada de voz */}
          {currentVoiceChannel && (
            <div className="absolute top-3 right-4 z-30 flex items-center gap-1.5 p-1 bg-background-card/90 backdrop-blur-md border border-background-border rounded-xl shadow-lg">
              {selectedTextChannel && (
                <button
                  onClick={() => setViewMode('TEXT')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    viewMode === 'TEXT'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">#{selectedTextChannel.name}</span>
                </button>
              )}

              <button
                onClick={() => setViewMode('VOICE')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'VOICE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">🔊 {currentVoiceChannel.name}</span>
              </button>
            </div>
          )}

          {/* Exibição condicional de Canal de Texto ou Sala de Voz */}
          {viewMode === 'VOICE' && currentVoiceChannel ? (
            <VoiceRoom onOpenSettings={() => setIsSettingsOpen(true)} />
          ) : selectedTextChannel ? (
            <TextChannelRoom channel={selectedTextChannel} />
          ) : (
            <VoiceRoom onOpenSettings={() => setIsSettingsOpen(true)} />
          )}
        </main>

        {/* Sidebar Direita */}
        <ActiveUsersSidebar
          isOpen={isUsersSidebarOpen}
          onClose={() => setIsUsersSidebarOpen(false)}
        />
      </div>

      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
