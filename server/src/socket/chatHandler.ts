import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { SafeUser, ChatMessage } from '../types/index.js';
import { presence } from './presence.js';

export function registerChatHandlers(io: Server, socket: Socket, user: SafeUser): void {
  socket.on('chat:send_message', async (data: { channelId: string; content: string }) => {
    try {
      const content = (data.content || '').trim();
      if (!content || content.length > 2000) return;

      const session = presence.getSession(socket.id);
      const channelId = data.channelId || session?.channelId;
      if (!channelId) return;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.run(`
        INSERT INTO messages (id, channel_id, user_id, username, avatar, role, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, channelId, user.id, user.username, user.avatar, user.role, content, now]);

      const message: ChatMessage = {
        id,
        channelId,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        content,
        createdAt: now
      };

      io.to(`channel:${channelId}`).emit('chat:message_received', { message });
    } catch (err: any) {
      console.error('[CHAT_ERROR]', err.message);
    }
  });

  socket.on('chat:typing', (data: { channelId: string; isTyping: boolean }) => {
    const session = presence.getSession(socket.id);
    const channelId = data.channelId || session?.channelId;
    if (!channelId) return;

    socket.to(`channel:${channelId}`).emit('chat:user_typing', {
      userId: user.id,
      username: user.username,
      isTyping: data.isTyping
    });
  });
}
