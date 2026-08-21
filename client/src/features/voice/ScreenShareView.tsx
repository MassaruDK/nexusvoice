import React, { useRef, useEffect, useState } from 'react';
import { Monitor, Maximize, Minimize, Pin, PinOff } from 'lucide-react';
import { ParticipantState } from '../../types/index.js';
import { Avatar } from '../ui/Avatar.js';

interface ScreenShareViewProps {
  stream: MediaStream;
  sharer: ParticipantState;
  isSelf: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  stream,
  sharer,
  isSelf,
  isPinned,
  onTogglePin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const handleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[260px] bg-background-darkest rounded-2xl overflow-hidden border border-background-border shadow-xl flex flex-col group transition-all duration-200 aspect-video"
    >
      {/* Barra Superior da Janela de Transmissão */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background-darkest/85 backdrop-blur-md border border-background-border/70 text-xs text-slate-100 font-semibold pointer-events-auto shadow-md">
          <Avatar src={sharer.avatar} name={sharer.username} size="sm" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {sharer.username} {isSelf && '(Você)'}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-accent-cyan/20 text-accent-cyan text-[10px] font-bold">
            AO VIVO
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto opacity-80 group-hover:opacity-100 transition-opacity">
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-colors shadow-md ${
                isPinned
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-background-darkest/85 border-background-border text-slate-300 hover:text-white'
              }`}
              title={isPinned ? 'Desafixar Janela' : 'Fixar / Expandir Tela'}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={handleFullScreen}
            className="p-2 rounded-xl bg-background-darkest/85 backdrop-blur-md border border-background-border text-slate-300 hover:text-white transition-colors shadow-md"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Renderização de Vídeo */}
      <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
