import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Tv,
  ChevronDown
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
  const [showVideo, setShowVideo] = useState(false);

  // Carrega volume persistido exato (ex: 3%)
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_music_vol');
    return saved !== null ? parseInt(saved, 10) : 50;
  });
  const [isMuted, setIsMuted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendYtCommand = useCallback((func: string, args: any[] = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (_) {}
  }, []);

  // Força volume persistido no iframe
  const enforceSavedVolume = useCallback(() => {
    const currentVol = isMuted ? 0 : volume;
    sendYtCommand('setVolume', [currentVol]);
    if (!isMuted && currentVol > 0) {
      sendYtCommand('unMute');
    }
  }, [isMuted, volume, sendYtCommand]);

  // Sincronizar estado da música com o Socket.IO
  useEffect(() => {
    if (!socket || !channelId) return;

    socket.emit('music:request_sync', { channelId });

    const onMusicSync = (data: { state: MusicState }) => {
      setMusicState(data.state);
    };

    socket.on('music:sync', onMusicSync);

    return () => {
      socket.off('music:sync', onMusicSync);
      sendYtCommand('stopVideo');
    };
  }, [socket, channelId, sendYtCommand]);

  // Quando a música muda ou inicia, aplica o volume em múltiplos tempos para travar na taxa escolhida (ex: 3%)
  useEffect(() => {
    if (!musicState.currentTrack) return;

    enforceSavedVolume();
    const t1 = setTimeout(enforceSavedVolume, 200);
    const t2 = setTimeout(enforceSavedVolume, 600);
    const t3 = setTimeout(enforceSavedVolume, 1200);

    if (musicState.isPlaying) {
      sendYtCommand('playVideo');
    } else {
      sendYtCommand('pauseVideo');
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [musicState.isPlaying, musicState.currentTrack?.youtubeId, enforceSavedVolume, sendYtCommand]);

  const togglePlay = () => {
    if (!socket?.connected || !musicState.currentTrack) return;
    const nextState = !musicState.isPlaying;
    socket.emit('music:toggle_play', {
      channelId,
      isPlaying: nextState,
    });
    if (nextState) {
      enforceSavedVolume();
      sendYtCommand('playVideo');
    } else {
      sendYtCommand('pauseVideo');
    }
  };

  const handleSkip = () => {
    if (!socket?.connected) return;
    socket.emit('music:skip', { channelId });
  };

  const handleStop = () => {
    if (!socket?.connected) return;
    sendYtCommand('stopVideo');
    socket.emit('music:stop', { channelId });
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('nexus_music_vol', newVol.toString());
    if (isMuted && newVol > 0) setIsMuted(false);
    sendYtCommand('setVolume', [newVol]);
    sendYtCommand('unMute');
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      sendYtCommand('mute');
    } else {
      sendYtCommand('unMute');
      sendYtCommand('setVolume', [volume]);
    }
  };

  const track = musicState.currentTrack;

  return (
    <>
      <div className="px-4 py-2.5 bg-background-card/95 border-b border-background-border/80 flex items-center justify-between gap-3 text-xs z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0 max-w-xs sm:max-w-md">
          {track ? (
            <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowVideo(!showVideo)}>
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-10 h-10 rounded-xl object-cover border border-brand-500/40 shadow-md"
              />
              {musicState.isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-background-surface flex items-center justify-center text-slate-500 border border-background-border flex-shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <p className="font-bold text-slate-100 truncate text-xs">
              {track ? track.title : 'Nenhuma música tocando'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {track ? `Adicionado por ${track.addedBy}` : 'Toque uma música do YouTube para a sala'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {track && (
            <>
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/30 flex items-center justify-center"
                title={musicState.isPlaying ? 'Pausar' : 'Tocar'}
              >
                {musicState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={handleSkip}
                className="p-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-300 transition-colors"
                title="Pular Música"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleStop}
                className="p-2 rounded-xl bg-background-surface hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-colors"
                title="Parar Música"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowVideo(!showVideo)}
                className={`p-2 rounded-xl border transition-colors ${
                  showVideo
                    ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                    : 'bg-background-surface hover:bg-background-hover border-background-border text-slate-400'
                }`}
                title="Alternar Miniatura de Vídeo"
              >
                <Tv className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background-surface border border-background-border">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
              className="w-16 sm:w-20 h-1.5 bg-background-darkest rounded-lg appearance-none cursor-pointer accent-brand-500"
              title="Volume da Música"
            />
            <span className="text-[10px] font-mono text-slate-400 w-6 text-right font-bold">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>

          {musicState.queue.length > 0 && (
            <button
              onClick={() => setIsQueueOpen((prev) => !prev)}
              className="relative p-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-300 transition-colors"
              title="Ver Fila de Músicas"
            >
              <ListMusic className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-brand-600 text-[9px] text-white font-bold">
                {musicState.queue.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Música</span>
          </button>
        </div>
      </div>

      {track && (
        <div
          className={`fixed bottom-20 right-6 z-40 bg-background-card border border-background-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            showVideo ? 'w-72 h-44 opacity-100 pointer-events-auto' : 'w-1 h-1 opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative w-full h-full bg-black">
            <iframe
              ref={iframeRef}
              key={track.youtubeId}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${track.youtubeId}?autoplay=1&enablejsapi=1&playsinline=1&controls=1&origin=${window.location.origin}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              title="Nexus YouTube Player"
              className="w-full h-full border-0"
              onLoad={enforceSavedVolume}
            />
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-white/80 hover:text-white transition-colors"
              title="Minimizar"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <YouTubeSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        channelId={channelId}
      />
    </>
  );
};
