import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  ListMusic,
  Plus,
  Radio,
} from 'lucide-react';
import { MusicState } from '../../types/index.js';
import { useSocket } from '../../context/SocketContext.js';
import { YouTubeSearchModal } from './YouTubeSearchModal.js';

interface MusicPlayerProps {
  channelId: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ channelId }) => {
  const { socket } = useSocket();

  const [musicState, setMusicState] = useState<MusicState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    lastUpdated: Date.now(),
    queue: [],
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    return parseInt(localStorage.getItem('nexus_music_vol') || '70', 10);
  });
  const [isMuted, setIsMuted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sincronizar estado da música com o Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.emit('music:request_sync', { channelId });

    const onMusicSync = (data: { state: MusicState }) => {
      setMusicState(data.state);
    };

    socket.on('music:sync', onMusicSync);

    return () => {
      socket.off('music:sync', onMusicSync);
    };
  }, [socket, channelId]);

  const togglePlay = () => {
    if (!socket?.connected || !musicState.currentTrack) return;
    socket.emit('music:toggle_play', {
      channelId,
      isPlaying: !musicState.isPlaying,
    });
  };

  const handleSkip = () => {
    if (!socket?.connected) return;
    socket.emit('music:skip', { channelId });
  };

  const handleStop = () => {
    if (!socket?.connected) return;
    socket.emit('music:stop', { channelId });
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('nexus_music_vol', newVol.toString());
    if (isMuted && newVol > 0) setIsMuted(false);
  };

  const track = musicState.currentTrack;

  return (
    <>
      <div className="px-4 py-2.5 bg-background-card/95 border-b border-background-border/80 flex items-center justify-between gap-3 text-xs z-20 backdrop-blur-md">
        {/* Informações da Faixa Atual */}
        <div className="flex items-center gap-3 min-w-0 max-w-xs sm:max-w-md">
          {track ? (
            <div className="relative flex-shrink-0">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-9 h-9 rounded-lg object-cover border border-background-border"
              />
              {musicState.isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-background-surface flex items-center justify-center text-slate-500 border border-background-border flex-shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <p className="font-bold text-slate-100 truncate">
              {track ? track.title : 'Nenhuma música tocando'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {track ? `Adicionado por ${track.addedBy}` : 'Toque uma música do YouTube'}
            </p>
          </div>
        </div>

        {/* Controles de Reprodução */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {track && (
            <>
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/20"
                title={musicState.isPlaying ? 'Pausar' : 'Tocar'}
              >
                {musicState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSkip}
                className="p-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-300 transition-colors"
                title="Pular Música"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleStop}
                className="p-2 rounded-xl bg-background-surface hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-colors"
                title="Parar Música"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Slider de Volume Individual */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-background-surface border border-background-border">
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="text-slate-400 hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
              className="w-16 h-1 bg-background-darkest rounded-lg appearance-none cursor-pointer accent-brand-500"
              title="Volume da Música"
            />
          </div>

          {/* Fila de Músicas */}
          {musicState.queue.length > 0 && (
            <button
              onClick={() => setIsQueueOpen((prev) => !prev)}
              className="relative p-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-300 transition-colors"
              title="Ver Fila de Músicas"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-brand-600 text-[9px] text-white font-bold">
                {musicState.queue.length}
              </span>
            </button>
          )}

          {/* Botão Adicionar Música */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Música</span>
          </button>
        </div>
      </div>

      {/* YouTube IFrame Oculto para Tocar o Áudio */}
      {track && (
        <div className="sr-only">
          <iframe
            ref={iframeRef}
            key={track.youtubeId}
            width="200"
            height="200"
            src={`https://www.youtube.com/embed/${track.youtubeId}?autoplay=${
              musicState.isPlaying && !isMuted ? '1' : '0'
            }&enablejsapi=1&origin=${window.location.origin}`}
            allow="autoplay"
            title="Nexus YouTube Audio"
          />
        </div>
      )}

      {/* Modal de Busca do YouTube */}
      <YouTubeSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        channelId={channelId}
      />
    </>
  );
};
