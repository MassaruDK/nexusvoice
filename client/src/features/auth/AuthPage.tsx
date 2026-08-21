import React, { useState } from 'react';
import { Radio, ShieldCheck, Server } from 'lucide-react';
import { LoginForm } from './LoginForm.js';
import { RegisterForm } from './RegisterForm.js';
import { ServerConfigModal } from '../settings/ServerConfigModal.js';
import { getBackendUrl } from '../../services/api.js';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  const currentBackend = getBackendUrl();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background-darkest relative p-4 overflow-hidden select-none">
      {/* Luzes de fundo atmosféricas */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de Configuração do Servidor no Topo Direito */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsServerModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-card/80 hover:bg-background-card border border-background-border text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md"
          title="Configurar URL do Servidor"
        >
          <Server className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">
            {currentBackend ? 'Servidor Conectado' : 'Configurar Servidor'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      <div className="w-full max-w-md bg-background-card/90 border border-background-border/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10 flex flex-col items-center animate-fade-in">
        {/* Logo e Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-cyan flex items-center justify-center text-white shadow-glow-brand">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Nexus Voice
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Voz, Vídeo, Chat e Música em Tempo Real</p>
          </div>
        </div>

        {/* Formulário de Login / Registro */}
        <div className="w-full">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>

        {/* Dicas de Acesso Rápido */}
        <div className="w-full mt-6 pt-5 border-t border-background-border/60 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Credenciais padrão para testes:</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            Admin: <span className="text-brand-300">admin@localhost</span> / <span className="text-brand-300">change-me</span>
          </p>
          <p className="text-[11px] text-slate-300 font-mono mt-0.5">
            Amigo: <span className="text-accent-cyan">amigo@nexusvoice.com</span> / <span className="text-accent-cyan">nexus123456</span>
          </p>
        </div>
      </div>

      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
      />
    </div>
  );
};
