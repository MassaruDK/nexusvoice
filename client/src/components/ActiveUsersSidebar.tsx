import React from 'react';
import { Users, Shield, Circle } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';
import { useVoice } from '../context/VoiceContext.js';
import { Avatar } from '../features/ui/Avatar.js';
import { Badge } from '../features/ui/Badge.js';

interface ActiveUsersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveUsersSidebar: React.FC<ActiveUsersSidebarProps> = ({ isOpen, onClose }) => {
  const { globalPresence } = useSocket();
  const { speakingUsers } = useVoice();

  // Consolidação de todos os usuários únicos ativos em qualquer canal
  const activeParticipantsMap = new Map<string, any>();
  for (const channelId in globalPresence) {
    globalPresence[channelId].forEach((p) => {
      activeParticipantsMap.set(p.userId, p);
    });
  }

  const activeParticipants = Array.from(activeParticipantsMap.values());

  return (
    <>
      {/* Backdrop mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background-darkest/80 backdrop-blur-sm z-40 xl:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-background-card border-l border-background-border flex flex-col transition-transform duration-200 ease-in-out xl:static xl:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-14 px-4 border-b border-background-border/80 flex items-center justify-between flex-shrink-0 bg-background-darkest/40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Users className="w-4 h-4 text-brand-400" />
            <span>Membros Online</span>
          </div>

          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-background-surface text-slate-300 border border-background-border">
            {activeParticipants.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {activeParticipants.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Nenhum membro ativo no momento
            </p>
          ) : (
            activeParticipants.map((p) => {
              const isSpeaking = speakingUsers.has(p.userId) || p.isSpeaking;

              return (
                <div
                  key={p.userId}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-background-surface/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={p.avatar}
                      name={p.username}
                      size="md"
                      isSpeaking={isSpeaking}
                      status="online"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {p.username}
                        </span>
                        {p.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
                      </div>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Circle className="w-1.5 h-1.5 fill-current" /> Em chamada
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
