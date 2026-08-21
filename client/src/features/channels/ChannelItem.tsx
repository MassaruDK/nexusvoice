import React from 'react';
import { Volume2, Edit2, Trash2, Mic, MicOff, Video, Monitor } from 'lucide-react';
import { VoiceChannel, ParticipantState } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useVoice } from '../../context/VoiceContext.js';
import { Avatar } from '../ui/Avatar.js';

interface ChannelItemProps {
  channel: VoiceChannel;
  participants: ParticipantState[];
  onEdit?: (channel: VoiceChannel) => void;
  onDelete?: (channel: VoiceChannel) => void;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  participants,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const { currentChannel, joinChannel, speakingUsers } = useVoice();

  const isConnectedToThis = currentChannel?.id === channel.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="group mb-1">
      {/* Botão do Canal */}
      <div
        onClick={() => joinChannel(channel)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && joinChannel(channel)}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer select-none ${
          isConnectedToThis
            ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
            : 'text-slate-300 hover:bg-background-surface hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${
              isConnectedToThis ? 'bg-brand-500 text-white' : 'bg-background-surface text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{channel.name}</p>
            {channel.description && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{channel.description}</p>
            )}
          </div>
        </div>

        {/* Ações de Administração (Discretas) */}
        {isAdmin && (
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={() => onEdit(channel)}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-background-hover transition-colors"
                title="Editar Canal"
                aria-label="Editar Canal"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(channel)}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-background-hover transition-colors"
                title="Excluir Canal"
                aria-label="Excluir Canal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista de Participantes Conectados ao Canal */}
      {participants.length > 0 && (
        <div className="ml-5 pl-3 border-l border-background-border/80 my-1 space-y-1">
          {participants.map((p) => {
            const isSpeaking = speakingUsers.has(p.userId) || p.isSpeaking;

            return (
              <div
                key={p.userId}
                className={`flex items-center justify-between py-1 px-2 rounded-lg text-xs transition-colors ${
                  isSpeaking ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-300 hover:bg-background-surface/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    src={p.avatar}
                    name={p.username}
                    size="sm"
                    isSpeaking={isSpeaking}
                  />
                  <span className="truncate font-medium">{p.username}</span>
                </div>

                {/* Ícones de Estado do Participante */}
                <div className="flex items-center gap-1 flex-shrink-0 text-slate-400">
                  {p.isScreenSharing && (
                    <span title="Transmitindo Tela">
                      <Monitor className="w-3.5 h-3.5 text-accent-cyan" />
                    </span>
                  )}
                  {p.hasVideo && (
                    <span title="Câmera Ativa">
                      <Video className="w-3.5 h-3.5 text-brand-400" />
                    </span>
                  )}
                  {p.isMuted ? (
                    <span title="Microfone Mutado">
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    </span>
                  ) : (
                    <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400' : 'text-slate-500'}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
