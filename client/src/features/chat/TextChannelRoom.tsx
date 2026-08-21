import React, { useState, useEffect, useRef } from 'react';
import {
  Hash,
  Send,
  Image,
  Video,
  Smile,
  Paperclip,
  X,
  Download,
  Maximize2,
  Sparkles,
  Link
} from 'lucide-react';
import { VoiceChannel, ChatMessage, User } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { Avatar } from '../ui/Avatar.js';
import { Badge } from '../ui/Badge.js';
import { UserProfilePreviewModal } from '../profile/UserProfilePreviewModal.js';

interface TextChannelRoomProps {
  channel: VoiceChannel;
  mentionInput?: string | null;
  onClearMention?: () => void;
}

export const TextChannelRoom: React.FC<TextChannelRoomProps> = ({
  channel,
  mentionInput,
  onClearMention,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { error, success } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif' | ''>('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza menções
  useEffect(() => {
    if (mentionInput) {
      setInputText((prev) => `${prev ? prev + ' ' : ''}@${mentionInput} `);
      onClearMention?.();
    }
  }, [mentionInput]);

  // Busca mensagens em tempo real (com polling a cada 1.2s para atualização instantânea)
  const fetchMessages = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await api.getMessages(channel.id);
      setMessages((prev) => {
        // Atualiza somente se houver mudanças para evitar re-renders desnecessários
        if (JSON.stringify(prev) === JSON.stringify(res.messages)) return prev;
        return res.messages;
      });
    } catch (err: any) {
      console.warn('[MSG_FETCH_ERR]', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 1200);
    return () => clearInterval(interval);
  }, [channel.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Escuta novas mensagens via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.emit('chat:join', { channelId: channel.id });

    const onNewMessage = (data: { message: ChatMessage }) => {
      if (data.message.channelId === channel.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    socket.on('chat:message', onNewMessage);

    return () => {
      socket.off('chat:message', onNewMessage);
    };
  }, [socket, channel.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !mediaUrl) || isSending || !user) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage(channel.id, {
        content: inputText.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType: mediaType || undefined,
      });

      setMessages((prev) => [...prev, res.message]);

      if (socket?.connected) {
        socket.emit('chat:send_message', {
          channelId: channel.id,
          message: res.message,
        });
      }

      setInputText('');
      setMediaUrl('');
      setMediaType('');
      setIsMediaModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  // Upload direto de arquivo (converte para Base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('O arquivo deve ter menos de 10MB');
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
      const result = event.target?.result as string;
      setMediaUrl(result);
      setMediaType(isVid ? 'video' : 'image');
      setIsMediaModalOpen(false);
      success(isVid ? 'Vídeo anexado!' : 'Imagem anexada!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-darkest relative">
      {/* Header do Canal de Texto */}
      <div className="h-14 px-5 border-b border-background-border/80 flex items-center justify-between flex-shrink-0 bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {channel.name}
            </h2>
            {channel.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-lg">
                {channel.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Boas-vindas ao canal */}
        <div className="py-6 px-4 mb-4 rounded-2xl bg-background-surface/50 border border-background-border/60">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center mb-3 border border-brand-500/30">
            <Hash className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Bem-vindo ao #{channel.name}!
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Este é o início do canal de texto #{channel.name}. Envie mensagens, imagens e vídeos à vontade!
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
            Carregando mensagens em tempo real...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhuma mensagem ainda. Seja o primeiro a conversar!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user?.id;
            return (
              <div
                key={msg.id}
                className="flex items-start gap-3 group hover:bg-background-hover/40 p-2 -mx-2 rounded-xl transition-colors"
              >
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedUserForProfile({
                      id: msg.userId,
                      username: msg.username,
                      email: '',
                      role: msg.role,
                      avatar: msg.avatar,
                    })
                  }
                  title="Ver perfil de quem enviou"
                >
                  <Avatar src={msg.avatar} name={msg.username} size="md" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      onClick={() =>
                        setSelectedUserForProfile({
                          id: msg.userId,
                          username: msg.username,
                          email: '',
                          role: msg.role,
                          avatar: msg.avatar,
                        })
                      }
                      className="text-xs font-bold text-slate-200 hover:text-brand-300 cursor-pointer transition-colors"
                    >
                      {msg.username}
                    </span>
                    {msg.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Conteúdo de Texto */}
                  {msg.content && (
                    <p className="text-sm text-slate-300 break-words leading-relaxed whitespace-pre-wrap select-text">
                      {msg.content}
                    </p>
                  )}

                  {/* Mídia Anexada (Imagem ou Vídeo) */}
                  {msg.mediaUrl && (
                    <div className="mt-2.5 max-w-sm sm:max-w-md rounded-xl overflow-hidden border border-background-border shadow-md">
                      {msg.mediaType === 'video' || msg.mediaUrl.includes('.mp4') || msg.mediaUrl.includes('.webm') ? (
                        <video
                          src={msg.mediaUrl}
                          controls
                          playsInline
                          className="w-full max-h-72 object-contain bg-black"
                        />
                      ) : (
                        <div
                          className="relative cursor-pointer group/img"
                          onClick={() => setLightboxUrl(msg.mediaUrl || null)}
                        >
                          <img
                            src={msg.mediaUrl}
                            alt="Mídia enviada"
                            className="w-full max-h-72 object-cover transition-transform group-hover/img:scale-[1.01]"
                          />
                          <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview de Mídia Anexada antes de enviar */}
      {mediaUrl && (
        <div className="px-5 py-2.5 bg-background-surface/90 border-t border-background-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {mediaType === 'video' ? (
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center text-brand-400 border border-background-border">
                <Video className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-background-border"
              />
            )}
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {mediaType === 'video' ? 'Vídeo anexado' : 'Imagem anexada'}
              </p>
              <p className="text-[10px] text-slate-400">Pronto para enviar</p>
            </div>
          </div>
          <button
            onClick={() => {
              setMediaUrl('');
              setMediaType('');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
            title="Remover anexo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Entrada de Mensagem */}
      <div className="p-4 bg-background-card/80 border-t border-background-border/80 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
            className="p-2.5 rounded-xl bg-background-surface hover:bg-background-hover text-slate-400 hover:text-brand-300 border border-background-border transition-colors"
            title="Enviar Foto ou Vídeo do Computador"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="p-2.5 rounded-xl bg-background-surface hover:bg-background-hover text-slate-400 hover:text-brand-300 border border-background-border transition-colors"
            title="Inserir Link de Imagem/Vídeo da Web"
          >
            <Link className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Conversar em #${channel.name}`}
            className="flex-1 px-4 py-2.5 bg-background-darkest border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !mediaUrl) || isSending}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white transition-all shadow-md shadow-brand-600/20 flex-shrink-0"
            title="Enviar Mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Modal para inserir Link */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-background-card border border-background-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Image className="w-4 h-4 text-brand-400" />
                Inserir Link de Imagem ou Vídeo
              </h3>
              <button
                onClick={() => setIsMediaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                if (e.target.value.includes('.mp4') || e.target.value.includes('.webm')) {
                  setMediaType('video');
                } else {
                  setMediaType('image');
                }
              }}
              placeholder="https://exemplo.com/imagem.png ou video.mp4"
              className="w-full px-3.5 py-2.5 bg-background-darkest border border-background-border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-background-surface hover:bg-background-hover text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mediaUrl.trim()) setIsMediaModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                Anexar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para Visualizar Imagem */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Ampliação"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Modal de Pré-visualização de Perfil de quem enviou mensagem */}
      <UserProfilePreviewModal
        user={selectedUserForProfile}
        isOpen={!!selectedUserForProfile}
        onClose={() => setSelectedUserForProfile(null)}
        onMention={(u) => setInputText((prev) => `${prev ? prev + ' ' : ''}@${u} `)}
      />
    </div>
  );
};
