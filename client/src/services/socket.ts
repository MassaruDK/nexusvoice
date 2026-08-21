import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from './api.js';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  const currentToken = token || localStorage.getItem('auth_token_ref') || undefined;
  const backendUrl = getBackendUrl() || window.location.origin;

  if (!socket) {
    socket = io(backendUrl, {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: currentToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Conectado ao servidor:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Desconectado:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[SOCKET] Erro de conexão:', err.message);
    });
  } else if (currentToken) {
    socket.auth = { token: currentToken };
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
