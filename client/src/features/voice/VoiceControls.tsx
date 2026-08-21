import React from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  PhoneOff,
} from 'lucide-react';
import { useVoice } from '../../context/VoiceContext.js';
import { Tooltip } from '../ui/Tooltip.js';

interface VoiceControlsProps {
  onOpenSettings: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ onOpenSettings }) => {
  const {
    isMuted,
    isDeafened,
    hasVideo,
    isScreenSharing,
    toggleMic,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    leaveChannel,
  } = useVoice();

  return (
    <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl glass-panel shadow-2xl border border-background-border/80">
      {/* Botão Microfone */}
      <Tooltip content={isMuted ? 'Desmutar (M)' : 'Mutar Microfone (M)'}>
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
              : 'bg-background-surface hover:bg-background-hover text-slate-100 border border-background-border'
          }`}
          aria-label={isMuted ? 'Desmutar' : 'Mutar'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </Tooltip>

      {/* Botão Ensurdecer */}
      <Tooltip content={isDeafened ? 'Desativar Ensurdecer (D)' : 'Ensurdecer Áudio (D)'}>
        <button
          onClick={toggleDeafen}
          className={`p-3.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
            isDeafened
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
              : 'bg-background-surface hover:bg-background-hover text-slate-100 border border-background-border'
          }`}
          aria-label={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
        >
          <Headphones className="w-5 h-5" />
        </button>
      </Tooltip>

      {/* Botão Câmera */}
      <Tooltip content={hasVideo ? 'Desligar Câmera' : 'Ligar Câmera'}>
        <button
          onClick={toggleCamera}
          className={`p-3.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
            hasVideo
              ? 'bg-brand-600 text-white shadow-glow-brand'
              : 'bg-background-surface hover:bg-background-hover text-slate-100 border border-background-border'
          }`}
          aria-label={hasVideo ? 'Desligar Câmera' : 'Ligar Câmera'}
        >
          {hasVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      </Tooltip>

      {/* Botão Compartilhar Tela */}
      <Tooltip content={isScreenSharing ? 'Parar Transmissão' : 'Compartilhar Tela'}>
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
            isScreenSharing
              ? 'bg-accent-cyan text-slate-950 font-bold shadow-lg shadow-accent-cyan/25'
              : 'bg-background-surface hover:bg-background-hover text-slate-100 border border-background-border'
          }`}
          aria-label={isScreenSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
      </Tooltip>

      {/* Separador */}
      <div className="w-[1px] h-7 bg-background-border my-auto mx-0.5" />

      {/* Configurações */}
      <Tooltip content="Configurações de Dispositivos">
        <button
          onClick={onOpenSettings}
          className="p-3.5 rounded-xl bg-background-surface hover:bg-background-hover text-slate-300 hover:text-white border border-background-border transition-colors flex items-center justify-center"
          aria-label="Configurações de Dispositivos"
        >
          <Settings className="w-5 h-5" />
        </button>
      </Tooltip>

      {/* Desconectar */}
      <Tooltip content="Desconectar da Chamada">
        <button
          onClick={leaveChannel}
          className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose font-bold transition-all duration-150 flex items-center justify-center"
          aria-label="Desconectar"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  );
};
