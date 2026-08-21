import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { SafeUser, JWTPayload } from '../types/index.js';
import { presence } from './presence.js';
import { registerWebRTCHandlers } from './webrtcHandler.js';
import { registerChatHandlers } from './chatHandler.js';
import { registerMusicHandlers } from './musicHandler.js';

let ioInstance: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  ioInstance = io;

  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);
        token = cookies[config.COOKIE_NAME];
      }

      if (!token) {
        return next(new Error('Autenticação necessária para conexão WebSocket'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      const user = await db.get<SafeUser>('SELECT id, username, email, role, avatar, created_at, updated_at FROM users WHERE id = ?', [decoded.id]);

      if (!user) {
        return next(new Error('Usuário inválido'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Token inválido ou expirado'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SafeUser;
    console.log(`[SOCKET] Usuário conectado: ${user.username} (${socket.id})`);

    socket.emit('presence:sync', {
      presence: presence.getAllPresence()
    });

    registerWebRTCHandlers(io, socket, user);
    registerChatHandlers(io, socket, user);
    registerMusicHandlers(io, socket, user);
  });

  return io;
}

export function getIO(): Server | null {
  return ioInstance;
}
