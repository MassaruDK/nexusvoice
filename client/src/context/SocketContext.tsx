import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.js';
import { ParticipantState } from '../types/index.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  globalPresence: Record<string, ParticipantState[]>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [globalPresence, setGlobalPresence] = useState<Record<string, ParticipantState[]>>({});

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const sock = getSocket(token || undefined);
    setSocket(sock);

    sock.connect();

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onPresenceSync = (data: { presence: Record<string, ParticipantState[]> }) => {
      setGlobalPresence(data.presence);
    };

    const onPresenceUpdate = (data: { presence: Record<string, ParticipantState[]> }) => {
      setGlobalPresence(data.presence);
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('presence:sync', onPresenceSync);
    sock.on('presence:update', onPresenceUpdate);

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('presence:sync', onPresenceSync);
      sock.off('presence:update', onPresenceUpdate);
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, globalPresence }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};
