import React, { useState, useEffect } from 'react';
import { Users, Shield, Circle, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { useVoice } from '../context/VoiceContext.js';
import { api } from '../services/api.js';
import { User } from '../types/index.js';
import { Avatar } from '../features/ui/Avatar.js';
import { Badge } from '../features/ui/Badge.js';

interface ActiveUsersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveUsersSidebar: React.FC<ActiveUsersSidebarProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const { socket, globalPresence } = useSocket();
  const { currentChannel: currentVoiceChannel, speakingUsers } = useVoice();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res && res.users) {
        setAllUsers(res.users);
      }
    } catch (e) {
      console.warn('[USERS_ERR]', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Atualiza imediatamente quando a presença de voz muda
  useEffect(() => {
    fetchUsers();
  }, [globalPresence]);

  // Mapeia onde cada usuário está conectado
  const userVoiceMap = new Map<string, string>();
  for (const channelId in globalPresence) {
    globalPresence[channelId].forEach((p) => {
      userVoiceMap.set(p.userId, channelId);
    });
  }

  // Lista consolidada de membros
  const members = allUsers.length > 0 ? allUsers : (currentUser ? [currentUser] : []);

  return (
    <>
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
            <span>Membros ({members.length})</span>
          </div>

          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Online
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading && members.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 animate-pulse">
              Carregando membros...
            </p>
          ) : (
            members.map((member) => {
              const isMe = member.id === currentUser?.id;
              const isInVoice = userVoiceMap.has(member.id) || (isMe && !!currentVoiceChannel);
              const isSpeaking = speakingUsers.has(member.id);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-background-surface/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar
                      src={member.avatar}
                      name={member.username}
                      size="md"
                      isSpeaking={isSpeaking}
                      status="online"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold truncate ${isMe ? 'text-brand-300' : 'text-slate-200'}`}>
                          {member.username}
                        </span>
                        {member.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
                      </div>

                      {isInVoice ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium truncate">
                          <Volume2 className="w-2.5 h-2.5 flex-shrink-0" /> Em chamada de voz
                        </span>
                      ) : (
                        <p className="text-[10px] text-slate-400 truncate">
                          {member.bio || '🟢 Online no servidor'}
                        </p>
                      )}
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
