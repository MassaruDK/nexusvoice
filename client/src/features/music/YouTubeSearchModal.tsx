import React, { useState } from 'react';
import { Search, Plus, Play, Link, Sparkles } from 'lucide-react';
import { MusicTrack } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface YouTubeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

const PRESET_TRACKS = [
  {
    youtubeId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  },
  {
    youtubeId: '5qap5aO4i9A',
    title: 'Lofi Synthwave Chillwave Beats',
    thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
  },
  {
    youtubeId: 'Dx5qFachd3A',
    title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
    thumbnail: 'https://img.youtube.com/vi/Dx5qFachd3A/hqdefault.jpg',
  },
  {
    youtubeId: 'DWcJFNfaw9c',
    title: 'Synthwave / Retro Electro Mix',
    thumbnail: 'https://img.youtube.com/vi/DWcJFNfaw9c/hqdefault.jpg',
  }
];

export const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({
  isOpen,
  onClose,
  channelId,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error } = useToast();

  const [inputUrl, setInputUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const extractYouTubeId = (url: string): string | null => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
        if (id && id.length === 11) return id;
      }
      if (url.includes('watch?v=')) {
        const id = url.split('watch?v=')[1]?.split('&')[0];
        if (id && id.length === 11) return id;
      }
      if (url.includes('embed/')) {
        const id = url.split('embed/')[1]?.split('?')[0]?.split('&')[0];
        if (id && id.length === 11) return id;
      }
      if (url.trim().length === 11) {
        return url.trim();
      }
      return null;
    } catch {
      return null;
    }
  };

  const handlePlayOrQueue = (youtubeId: string, title: string, isQueue: boolean = false) => {
    if (!socket?.connected || !user) {
      error('Sem conexão com o servidor');
      return;
    }

    const track: MusicTrack = {
      youtubeId,
      title,
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      duration: 0,
      addedBy: user.username,
    };

    if (isQueue) {
      socket.emit('music:add_queue', { channelId, track });
      success(`"${title}" adicionada à fila!`);
    } else {
      socket.emit('music:play_track', { channelId, track });
      success(`Tocando agora: "${title}"`);
    }

    setInputUrl('');
    setCustomTitle('');
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent, isQueue: boolean = false) => {
    e.preventDefault();
    const ytId = extractYouTubeId(inputUrl.trim());

    if (!ytId) {
      error('Por favor, insira um link válido do YouTube (ex: https://www.youtube.com/watch?v=...)');
      return;
    }

    const title = customTitle.trim() || `Música do YouTube (${ytId})`;
    handlePlayOrQueue(ytId, title, isQueue);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Música no Canal de Voz (YouTube)"
      description="Toque músicas sincronizadas para todos os membros da sala"
      maxWidth="lg"
    >
      <div className="space-y-5 pt-2">
        {/* Inserir Link do YouTube */}
        <form className="space-y-3 p-4 rounded-xl bg-background-surface/60 border border-background-border">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Link className="w-4 h-4 text-brand-400" />
            Link do YouTube
          </label>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Ex: https://www.youtube.com/watch?v=jfKfPfyJRdk"
            className="w-full px-3.5 py-2.5 bg-background-darkest border border-background-border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Título da Música (Opcional)"
            className="w-full px-3.5 py-2 bg-background-darkest border border-background-border rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              disabled={!inputUrl.trim()}
              onClick={(e) => handleCustomSubmit(e, true)}
            >
              Fila
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5" />}
              disabled={!inputUrl.trim()}
              onClick={(e) => handleCustomSubmit(e, false)}
            >
              Tocar Agora
            </Button>
          </div>
        </form>

        {/* Sugestões Rápidas */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Sugestões Rápidas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {PRESET_TRACKS.map((t) => (
              <div
                key={t.youtubeId}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface hover:bg-background-hover border border-background-border/70 transition-all group"
              >
                <img
                  src={t.thumbnail}
                  alt={t.title}
                  className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">YouTube Stream</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePlayOrQueue(t.youtubeId, t.title, true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-background-darkest transition-colors"
                    title="Adicionar à Fila"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePlayOrQueue(t.youtubeId, t.title, false)}
                    className="p-1.5 rounded-lg bg-brand-600/30 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
                    title="Tocar Agora"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
