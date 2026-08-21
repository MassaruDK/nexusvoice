import React, { useState } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { ActiveUsersSidebar } from './ActiveUsersSidebar.js';
import { VoiceRoom } from '../features/voice/VoiceRoom.js';
import { DeviceSettingsModal } from '../features/settings/DeviceSettingsModal.js';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUsersSidebarOpen, setIsUsersSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-background-darkest overflow-hidden">
      {/* Header (Visível apenas em telas pequenas) */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleUsers={() => setIsUsersSidebarOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerda (Canais & Perfil) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Área Central (Voz / Câmeras / Screen Share) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <VoiceRoom onOpenSettings={() => setIsSettingsOpen(true)} />
        </main>

        {/* Sidebar Direita (Participantes Ativos) */}
        <ActiveUsersSidebar
          isOpen={isUsersSidebarOpen}
          onClose={() => setIsUsersSidebarOpen(false)}
        />
      </div>

      {/* Modal de Configurações de Dispositivos */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
