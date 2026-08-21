import React, { useState } from 'react';
import { Volume2, Users, Wifi, MessageSquare, Monitor, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useVoice } from '../../context/VoiceContext.js';
import { ParticipantCard } from './ParticipantCard.js';
import { ScreenShareView } from './ScreenShareView.js';
import { VoiceControls } from './VoiceControls.js';
import { ChatPanel } from '../chat/ChatPanel.js';
import { MusicPlayer } from '../music/MusicPlayer.js';

interface VoiceRoomProps {
  onOpenSettings: () => void;
}

export const VoiceRoom: React.FC<VoiceRoomProps> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const {
    currentChannel,
    participants,
    localAudioStream,
    localVideoStream,
    localScreenStream,
    remoteStreams,
    speakingUsers,
    isLocalSpeaking,
    isMuted,
    isDeafened,
    hasVideo,
    isScreenSharing,
  } = useVoice();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pinnedSharerId, setPinnedSharerId] = useState<string | null>(null);

  if (!currentChannel || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background-darkest">
        <div className="w-20 h-20 rounded-3xl bg-background-surface border border-background-border flex items-center justify-center mb-4 text-slate-500 shadow-2xl">
          <Volume2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-200">Nenhum canal conectado</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Selecione um canal de voz na barra lateral esquerda para entrar e começar a conversar.
        </p>
      </div>
    );
  }

  const selfParticipant = {
    socketId: 'self',
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    role: user.role,
    channelId: currentChannel.id,
    isMuted,
    isDeafened,
    hasVideo,
    isScreenSharing,
    isSpeaking: isLocalSpeaking,
    joinedAt: new Date().toISOString(),
  };

  const allParticipants = [
    selfParticipant,
    ...participants.filter((p) => p.userId !== user.id),
  ];

  // Lista de todos que estão compartilhando tela simultaneamente
  const screenSharers = allParticipants.filter((p) => p.isScreenSharing);

  // Layout harmônico dinâmico para múltiplas transmissões de tela
  let screenGridClass = 'grid-cols-1 max-w-5xl mx-auto';
  if (screenSharers.length === 2) {
    screenGridClass = 'grid-cols-1 md:grid-cols-2';
  } else if (screenSharers.length >= 3) {
    screenGridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
  }

  // Layout dos cards de participantes
  const count = allParticipants.length;
  let participantGridClass = 'grid-cols-1 md:grid-cols-2';
  if (count === 1) participantGridClass = 'grid-cols-1 max-w-xl mx-auto';
  else if (count === 2) participantGridClass = 'grid-cols-1 md:grid-cols-2';
  else if (count >= 3 && count <= 4) participantGridClass = 'grid-cols-1 sm:grid-cols-2';
  else if (count > 4) participantGridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-darkest relative">
      {/* Header do Canal */}
      <div className="h-14 px-5 border-b border-background-border/80 flex items-center justify-between flex-shrink-0 bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">{currentChannel.name}</h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Wifi className="w-2.5 h-2.5" /> Conectado (RTC)
              </span>
            </div>
            {currentChannel.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {currentChannel.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {screenSharers.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-xs font-semibold">
              <Monitor className="w-3.5 h-3.5" />
              <span>{screenSharers.length} {screenSharers.length === 1 ? 'Transmissão ativa' : 'Transmissões ativas'}</span>
            </span>
          )}

          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isChatOpen
                ? 'bg-brand-600 text-white border-brand-500 shadow-glow-brand'
                : 'bg-background-surface hover:bg-background-hover text-slate-300 border-background-border'
            }`}
            title="Chat de Texto do Canal"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <Users className="w-4 h-4 text-brand-400" />
            <span>
              {allParticipants.length} {allParticipants.length === 1 ? 'membro' : 'membros'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra Sincronizada de Música (YouTube) */}
      <MusicPlayer channelId={currentChannel.id} />

      {/* Conteúdo Central */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
            {/* GRID HARMÔNICO DE TRANSMISSÕES DE TELA (1, 2, 3, 4+ Telas) */}
            {screenSharers.length > 0 && (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span className="flex items-center gap-1.5 text-accent-cyan">
                    <LayoutGrid className="w-4 h-4" />
                    Transmissões em Tempo Real ({screenSharers.length})
                  </span>
                  {pinnedSharerId && (
                    <button
                      onClick={() => setPinnedSharerId(null)}
                      className="text-[11px] text-brand-400 hover:underline"
                    >
                      Exibir Todas em Grade
                    </button>
                  )}
                </div>

                <div className={`grid ${pinnedSharerId ? 'grid-cols-1' : screenGridClass} gap-4 w-full`}>
                  {screenSharers
                    .filter((sharer) => !pinnedSharerId || sharer.userId === pinnedSharerId)
                    .map((sharer) => {
                      const isSelf = sharer.userId === user.id;
                      const stream = isSelf
                        ? localScreenStream
                        : remoteStreams.get(sharer.socketId);

                      return (
                        <ScreenShareView
                          key={sharer.userId}
                          stream={stream || new MediaStream()}
                          sharer={sharer}
                          isSelf={isSelf}
                          isPinned={pinnedSharerId === sharer.userId}
                          onTogglePin={() =>
                            setPinnedSharerId(pinnedSharerId === sharer.userId ? null : sharer.userId)
                          }
                        />
                      );
                    })}
                </div>
              </div>
            )}

            {/* GRID DE PARTICIPANTES */}
            <div className={`grid ${participantGridClass} gap-3.5 w-full flex-1 auto-rows-fr`}>
              {allParticipants.map((p) => {
                const isSelf = p.userId === user.id;
                const stream = isSelf
                  ? (hasVideo ? localVideoStream : localAudioStream)
                  : remoteStreams.get(p.socketId);
                const isSpeaking = speakingUsers.has(p.userId) || p.isSpeaking;

                return (
                  <ParticipantCard
                    key={p.userId}
                    participant={p}
                    isSelf={isSelf}
                    stream={stream}
                    isSpeaking={isSpeaking}
                    onPinScreen={() => setPinnedSharerId(p.userId)}
                    isScreenPinned={pinnedSharerId === p.userId}
                  />
                );
              })}
            </div>
          </div>

          {/* Barra Flutuante de Controles */}
          <div className="p-4 flex justify-center items-center flex-shrink-0">
            <VoiceControls onOpenSettings={onOpenSettings} />
          </div>
        </div>

        {/* Chat Lateral */}
        {isChatOpen && (
          <ChatPanel
            channelId={currentChannel.id}
            channelName={currentChannel.name}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
