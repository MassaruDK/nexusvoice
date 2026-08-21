import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Paperclip, Image, Video, Link as LinkIcon } from 'lucide-react';
import { ChatMessage } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ChatMessageItem } from './ChatMessageItem.js';

interface ChatPanelProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ channelId, channelName, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { error, success } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif' | ''>('');
  const [isSending, setIsSending] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico inicial de mensagens
  const loadMessages = async () => {
    try {
      const data = await api.getMessages(channelId);
      setMessages(data.messages);
    } catch (err) {
      console.warn('[CHAT] Erro ao carregar mensagens:', err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [channelId]);

  // Escutar novas mensagens via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.emit('chat:join', { channelId });

    const onMessageReceived = (data: { message: ChatMessage }) => {
      if (data.message.channelId === channelId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    socket.on('chat:message_received', onMessageReceived);
    socket.on('chat:message', onMessageReceived);

    return () => {
      socket.off('chat:message_received', onMessageReceived);
      socket.off('chat:message', onMessageReceived);
    };
  }, [socket, channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !mediaUrl) || isSending || !user) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage(channelId, {
        content: inputText.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      });

      setMessages((prev) => [...prev, res.message]);

      if (socket?.connected) {
        socket.emit('chat:send_message', {
          channelId,
          message: res.message,
        });
      }

      setInputText('');
      setMediaUrl('');
      setMediaType('');
    } catch (err: any) {
      error(err.message || 'Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  // Upload local de foto/vídeo do computador
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('O arquivo deve ter no máximo 10MB');
      return;
    }

    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (!isVid && !isImg) {
      error('Envie apenas arquivos de imagem ou vídeo');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target?.result as string);
      setMediaType(isVid ? 'video' : 'image');
      success(isVid ? 'Vídeo anexado!' : 'Imagem anexada!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-80 h-full bg-background-card border-l border-background-border flex flex-col flex-shrink-0 z-30 animate-fade-in">
      {/* Header do Chat */}
      <div className="h-14 px-4 border-b border-background-border flex items-center justify-between flex-shrink-0 bg-background-darkest/40">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-100 uppercase tracking-wider">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <span className="truncate">Chat: #{channelName}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-background-surface transition-colors"
          aria-label="Fechar Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">Nenhuma mensagem ainda</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Envie a primeira mensagem para a sala!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isSelf={msg.userId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview de Mídia Anexada */}
      {mediaUrl && (
        <div className="px-3 py-2 bg-background-surface border-t border-background-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {mediaType === 'video' ? (
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-brand-400">
                <Video className="w-4 h-4" />
              </div>
            ) : (
              <img src={mediaUrl} alt="Preview" className="w-8 h-8 rounded object-cover" />
            )}
            <span className="text-[11px] text-slate-300 truncate">
              {mediaType === 'video' ? 'Vídeo pronto' : 'Imagem pronta'}
            </span>
          </div>
          <button
            onClick={() => { setMediaUrl(''); setMediaType(''); }}
            className="p-1 text-slate-400 hover:text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input de Envio */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-background-border bg-background-darkest/40 flex items-center gap-1.5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-400 hover:text-brand-300 border border-background-border transition-colors flex-shrink-0"
          title="Anexar Imagem ou Vídeo do Computador"
        >
          <Paperclip className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsMediaModalOpen(true)}
          className="p-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-400 hover:text-brand-300 border border-background-border transition-colors flex-shrink-0"
          title="Inserir Link da Web"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enviar mensagem..."
          className="flex-1 px-3 py-2 bg-background-surface border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !mediaUrl) || isSending}
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-600/20 flex-shrink-0"
          aria-label="Enviar"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Modal para colar Link */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-background-card border border-background-border rounded-2xl p-4 shadow-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-brand-400" /> Link de Imagem / Vídeo
            </h4>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                setMediaType(e.target.value.includes('.mp4') || e.target.value.includes('.webm') ? 'video' : 'image');
              }}
              placeholder="https://exemplo.com/foto.jpg"
              className="w-full px-3 py-2 bg-background-darkest border border-background-border rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-background-surface text-slate-300 text-xs"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => { if (mediaUrl.trim()) setIsMediaModalOpen(false); }}
                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs"
              >
                Anexar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
