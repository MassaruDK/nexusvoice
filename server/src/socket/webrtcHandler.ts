import { Server, Socket } from 'socket.io';
import { presence } from './presence.js';
import { SafeUser } from '../types/index.js';

export function registerWebRTCHandlers(io: Server, socket: Socket, user: SafeUser): void {
  socket.on('voice:join', (data: { channelId: string; mediaState?: { isMuted?: boolean; isDeafened?: boolean; hasVideo?: boolean; isScreenSharing?: boolean } }) => {
    try {
      const { channelId, mediaState } = data;
      console.log(`[VOICE] Usuário '${user.username}' (${socket.id}) entrando no canal ${channelId}`);

      const { participant, previousChannelId } = presence.joinChannel(socket.id, user, channelId, mediaState);

      if (previousChannelId && previousChannelId !== channelId) {
        socket.leave(`channel:${previousChannelId}`);
        io.to(`channel:${previousChannelId}`).emit('voice:user_left', {
          socketId: socket.id,
          userId: user.id,
          channelId: previousChannelId
        });
      }

      socket.join(`channel:${channelId}`);

      const participants = presence.getChannelParticipants(channelId);

      socket.emit('voice:joined', {
        channelId,
        participants,
        selfParticipant: participant
      });

      socket.to(`channel:${channelId}`).emit('voice:user_joined', {
        participant
      });

      io.emit('presence:update', {
        presence: presence.getAllPresence()
      });
    } catch (err: any) {
      console.error('[VOICE_JOIN_ERROR]', err.message);
      socket.emit('voice:error', { message: 'Falha ao entrar no canal de voz' });
    }
  });

  socket.on('voice:leave', () => {
    try {
      const { leftParticipant, channelId } = presence.leaveChannel(socket.id);
      if (channelId && leftParticipant) {
        console.log(`[VOICE] Usuário '${user.username}' saindo do canal ${channelId}`);
        socket.leave(`channel:${channelId}`);

        io.to(`channel:${channelId}`).emit('voice:user_left', {
          socketId: socket.id,
          userId: user.id,
          channelId
        });

        io.emit('presence:update', {
          presence: presence.getAllPresence()
        });
      }
    } catch (err: any) {
      console.error('[VOICE_LEAVE_ERROR]', err.message);
    }
  });

  socket.on('webrtc:offer', (data: { targetSocketId: string; offer: any }) => {
    const session = presence.getSession(socket.id);
    if (!session) return;

    io.to(data.targetSocketId).emit('webrtc:offer', {
      fromSocketId: socket.id,
      fromUserId: user.id,
      username: user.username,
      avatar: user.avatar,
      offer: data.offer
    });
  });

  socket.on('webrtc:answer', (data: { targetSocketId: string; answer: any }) => {
    const session = presence.getSession(socket.id);
    if (!session) return;

    io.to(data.targetSocketId).emit('webrtc:answer', {
      fromSocketId: socket.id,
      answer: data.answer
    });
  });

  socket.on('webrtc:ice-candidate', (data: { targetSocketId: string; candidate: any }) => {
    const session = presence.getSession(socket.id);
    if (!session) return;

    io.to(data.targetSocketId).emit('webrtc:ice-candidate', {
      fromSocketId: socket.id,
      candidate: data.candidate
    });
  });

  socket.on('media:state_changed', (state: { isMuted?: boolean; isDeafened?: boolean; hasVideo?: boolean; isScreenSharing?: boolean }) => {
    const updated = presence.updateMediaState(socket.id, state);
    if (updated) {
      io.to(`channel:${updated.channelId}`).emit('media:state_changed', {
        socketId: socket.id,
        userId: user.id,
        channelId: updated.channelId,
        mediaState: {
          isMuted: updated.isMuted,
          isDeafened: updated.isDeafened,
          hasVideo: updated.hasVideo,
          isScreenSharing: updated.isScreenSharing
        }
      });
    }
  });

  socket.on('media:speaking', (data: { isSpeaking: boolean }) => {
    const updated = presence.updateSpeakingState(socket.id, data.isSpeaking);
    if (updated) {
      socket.to(`channel:${updated.channelId}`).emit('media:speaking', {
        socketId: socket.id,
        userId: user.id,
        channelId: updated.channelId,
        isSpeaking: data.isSpeaking
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Cliente desconectado: ${user.username} (${socket.id})`);
    const { leftParticipant, channelId } = presence.leaveChannel(socket.id);
    if (channelId && leftParticipant) {
      io.to(`channel:${channelId}`).emit('voice:user_left', {
        socketId: socket.id,
        userId: user.id,
        channelId
      });

      io.emit('presence:update', {
        presence: presence.getAllPresence()
      });
    }
  });
}
