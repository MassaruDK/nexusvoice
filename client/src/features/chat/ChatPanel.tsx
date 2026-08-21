import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Smile } from 'lucide-react';
import { ChatMessage } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { ChatMessageItem } from './ChatMessageItem.js';

interface ChatPanelProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ channelId, channelName, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Carregar histórico inicial de mensagens
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await api.getMessages(channelId);
        setMessages(data.messages);
      } catch (err) {
        console.warn('[CHAT] Erro ao carregar mensagens:', err);
      }
    };

    loadMessages();
  }, [channelId]);

  // Escutar novas mensagens e digitação via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const onMessageReceived = (data: { message: ChatMessage }) => {
      if (data.message.channelId === channelId) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    const onUserTyping = (data: { userId: string; username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) next.add(data.username);
        else next.delete(data.username);
        return next;
      });
    };

    socket.on('chat:message_received', onMessageReceived);
    socket.on('chat:user_typing', onUserTyping);

    return () => {
      socket.off('chat:message_received', onMessageReceived);
      socket.off('chat:user_typing', onUserTyping);
    };
  }, [socket, channelId]);

  // Autoscroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket?.connected || !user) return;

    socket.emit('chat:send_message', {
      channelId,
      content: inputText.trim(),
    });

    setInputText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('chat:typing', { channelId, isTyping: false });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket?.connected) {
      socket.emit('chat:typing', { channelId, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        socket.emit('chat:typing', { channelId, isTyping: false });
      }, 2000);
    }
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

      {/* Indicador de Digitação */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1 text-[10px] text-slate-400 italic">
          {Array.from(typingUsers).join(', ')} está digitando...
        </div>
      )}

      {/* Input de Envio */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-background-border bg-background-darkest/40 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Enviar mensagem..."
          className="flex-1 px-3 py-2 bg-background-surface border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-600/20 flex-shrink-0"
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
