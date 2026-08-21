import React, { useRef, useEffect } from 'react';
import { Monitor, X, Maximize } from 'lucide-react';
import { ParticipantState } from '../../types/index.js';

interface ScreenShareViewProps {
  stream: MediaStream;
  sharer: ParticipantState;
  isSelf: boolean;
  onClose?: () => void;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  stream,
  sharer,
  isSelf,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.log('[SCREEN] Autoplay handled:', e));
    }
  }, [stream]);

  const handleFullScreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] flex-1 bg-background-darkest rounded-2xl overflow-hidden border border-background-border shadow-2xl flex flex-col">
      {/* Header do Compartilhamento */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background-darkest/90 backdrop-blur-md border border-background-border text-xs text-slate-100 font-semibold pointer-events-auto">
          <Monitor className="w-4 h-4 text-accent-cyan" />
          <span>Tela de {sharer.username} {isSelf && '(Você)'}</span>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={handleFullScreen}
            className="p-2 rounded-xl bg-background-darkest/90 backdrop-blur-md border border-background-border text-slate-300 hover:text-white transition-colors"
            title="Tela Cheia"
            aria-label="Tela Cheia"
          >
            <Maximize className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-background-darkest/90 backdrop-blur-md border border-background-border text-slate-300 hover:text-rose-400 transition-colors"
              title="Ocultar Visão em Destaque"
              aria-label="Ocultar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Vídeo da Tela - muted={true} garante que o navegador nunca bloqueie frames com tela preta */}
      <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain max-h-[70vh]"
        />
      </div>
    </div>
  );
};
