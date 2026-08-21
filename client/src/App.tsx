import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useVoice } from './context/VoiceContext.js';
import { AuthPage } from './features/auth/AuthPage.js';
import { Layout } from './components/Layout.js';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { isJoined, toggleMic, toggleDeafen } = useVoice();

  // Atalhos Globais de Teclado (M: Mute, D: Deafen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em input ou textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (isJoined) {
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          toggleMic();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          toggleDeafen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJoined, toggleMic, toggleDeafen]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background-darkest text-slate-300">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Carregando Nexus Voice...</p>
      </div>
    );
  }

  return user ? <Layout /> : <AuthPage />;
};
