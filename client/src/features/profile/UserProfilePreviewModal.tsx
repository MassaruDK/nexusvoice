import React from 'react';
import { User, VoiceChannel } from '../../types/index.js';
import { Avatar } from '../ui/Avatar.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Volume2, Calendar, MessageSquare, Edit3, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface UserProfilePreviewModalProps {
  user: User | null;
  isInVoice?: boolean;
  voiceChannelName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: () => void;
  onMention?: (username: string) => void;
}

export const UserProfilePreviewModal: React.FC<UserProfilePreviewModalProps> = ({
  user,
  isInVoice,
  voiceChannelName,
  isOpen,
  onClose,
  onOpenEdit,
  onMention,
}) => {
  const { user: currentUser } = useAuth();
  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Recentemente';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Perfil do Usuário">
      <div className="space-y-4">
        {/* Banner Superior Estilizado */}
        <div className="relative -mx-6 -mt-6 h-24 bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-cyan rounded-t-2xl flex items-end p-4">
          <div className="absolute -bottom-8 left-6">
            <div className="p-1 rounded-2xl bg-background-card ring-4 ring-background-card shadow-2xl">
              <Avatar src={user.avatar} name={user.username} size="2xl" />
            </div>
          </div>
        </div>

        {/* Espaçamento para o Avatar */}
        <div className="pt-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">{user.username}</h3>
              {user.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">@{user.username.toLowerCase().replace(/\s+/g, '_')}</p>
          </div>

          {isMe && onOpenEdit ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onOpenEdit();
              }}
            >
              Editar Perfil
            </Button>
          ) : onMention ? (
            <Button
              variant="primary"
              size="sm"
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={() => {
                onMention(user.username);
                onClose();
              }}
            >
              Mencionar
            </Button>
          ) : null}
        </div>

        {/* Status de Presença */}
        <div className="p-3 rounded-xl bg-background-darkest border border-background-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status</span>
            {isInVoice ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Em chamada {voiceChannelName ? `(${voiceChannelName})` : ''}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online no Nexus Voice</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-background-border/60">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Membro desde {joinDate}</span>
          </div>
        </div>

        {/* Sobre Mim / Bio */}
        <div className="p-3.5 rounded-xl bg-background-surface/80 border border-background-border space-y-1.5">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Sobre Mim</span>
          <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {user.bio && user.bio.trim() ? user.bio : 'Este usuário ainda não adicionou uma biografia.'}
          </p>
        </div>
      </div>
    </Modal>
  );
};
