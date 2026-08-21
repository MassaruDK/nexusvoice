import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, Headphones, Monitor, Maximize2 } from 'lucide-react';
import { ParticipantState } from '../../types/index.js';
import { Avatar } from '../ui/Avatar.js';
import { Badge } from '../ui/Badge.js';

interface ParticipantCardProps {
  participant: ParticipantState;
  isSelf: boolean;
  stream?: MediaStream | null;
  isSpeaking: boolean;
  onPinScreen?: () => void;
  isScreenPinned?: boolean;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isSelf,
  stream,
  isSpeaking,
  onPinScreen,
  isScreenPinned,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasVideoTrack = !!stream?.getVideoTracks().some(t => t.readyState === 'live');
  const hasAudioTrack = !!stream?.getAudioTracks().some(t => t.readyState === 'live');

  // Conectar o stream de vídeo ao elemento <video>
  useEffect(() => {
    if (videoRef.current && stream && hasVideoTrack) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.log('[VIDEO] Play auto blocked:', e));
    }
  }, [stream, hasVideoTrack]);

  // Conectar o áudio remoto ao elemento <audio> oculto
  useEffect(() => {
    if (!isSelf && audioRef.current && stream && hasAudioTrack) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((e) => console.log('[AUDIO] Play auto blocked:', e));
    }
  }, [isSelf, stream, hasAudioTrack]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl bg-background-card border transition-all duration-200 overflow-hidden group min-h-[170px] ${
        isSpeaking
          ? 'border-emerald-500/80 shadow-glow-emerald bg-background-card/90'
          : 'border-background-border/80 hover:border-background-border'
      }`}
    >
      {/* Elemento de Áudio Remoto */}
      {!isSelf && <audio ref={audioRef} autoPlay playsInline />}

      {/* Exibição de Vídeo / Câmera ou Tela se ativa */}
      {hasVideoTrack ? (
        <div className="absolute inset-0 w-full h-full bg-black/90 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isSelf}
            className={`w-full h-full object-cover ${isSelf && !participant.isScreenSharing ? 'scale-x-[-1]' : ''}`}
          />
        </div>
      ) : (
        /* Exibição do Avatar e Informações */
        <div className="flex flex-col items-center justify-center z-10 space-y-3">
          <Avatar
            src={participant.avatar}
            name={participant.username}
            size="xl"
            isSpeaking={isSpeaking}
          />
        </div>
      )}

      {/* Barra Inferior com Nome e Ícones de Status */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-darkest/80 backdrop-blur-md border border-background-border/50 text-xs font-medium text-slate-100 max-w-[70%]">
          <span className="truncate">{participant.username}</span>
          {isSelf && <span className="text-[10px] text-slate-400 font-normal">(Você)</span>}
          {participant.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
        </div>

        {/* Indicadores de Mídia */}
        <div className="flex items-center gap-1">
          {participant.isScreenSharing && (
            <div
              className="p-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 pointer-events-auto cursor-pointer"
              onClick={onPinScreen}
              title="Fixar Transmissão"
            >
              <Monitor className="w-3.5 h-3.5" />
            </div>
          )}

          {participant.hasVideo && (
            <div className="p-1.5 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30">
              <Video className="w-3.5 h-3.5" />
            </div>
          )}

          {participant.isDeafened ? (
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Headphones className="w-3.5 h-3.5" />
            </div>
          ) : participant.isMuted ? (
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                isSpeaking
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-background-darkest/80 text-slate-400'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
