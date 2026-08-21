import React, { useState } from 'react';
import { Maximize2, FileVideo } from 'lucide-react';
import { ChatMessage } from '../../types/index.js';
import { Avatar } from '../ui/Avatar.js';
import { Badge } from '../ui/Badge.js';

interface ChatMessageItemProps {
  message: ChatMessage;
  isSelf: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isSelf }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div
        className={`flex items-start gap-2.5 px-3 py-2 rounded-xl transition-colors hover:bg-background-hover/50 group ${
          isSelf ? 'bg-brand-600/5 border border-brand-500/10' : ''
        }`}
      >
        <Avatar src={message.avatar} name={message.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 leading-none mb-1">
            <span className="text-xs font-bold text-slate-200">{message.username}</span>
            {message.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
            <span className="text-[10px] text-slate-500">{formattedTime}</span>
          </div>

          {/* Conteúdo de Texto */}
          {message.content && (
            <p className="text-xs text-slate-300 break-words leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
            </p>
          )}

          {/* Mídia Anexada (Imagem ou Vídeo) */}
          {message.mediaUrl && (
            <div className="mt-2 max-w-xs sm:max-w-sm rounded-xl overflow-hidden border border-background-border shadow-sm">
              {message.mediaType === 'video' || message.mediaUrl.includes('.mp4') || message.mediaUrl.includes('.webm') ? (
                <video
                  src={message.mediaUrl}
                  controls
                  playsInline
                  className="w-full max-h-60 object-contain bg-black rounded-lg"
                />
              ) : (
                <div
                  className="relative cursor-pointer group/zoom"
                  onClick={() => setIsZoomed(true)}
                  title="Clique para ampliar"
                >
                  <img
                    src={message.mediaUrl}
                    alt="Mídia"
                    className="w-full max-h-60 object-cover rounded-lg transition-transform group-hover/zoom:scale-[1.01]"
                  />
                  <div className="absolute top-2 right-2 p-1 rounded-md bg-black/70 text-white opacity-0 group-hover/zoom:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Lightbox de Zoom */}
      {isZoomed && message.mediaUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={message.mediaUrl}
            alt="Ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
