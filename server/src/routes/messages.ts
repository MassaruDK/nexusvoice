import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { ChatMessage } from '../types/index.js';
import { getIO } from '../socket/index.js';

const router = Router();

router.get('/:channelId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const limit = parseInt(req.query.limit as string || '100', 10);

    const rows = await db.query<ChatMessage>(`
      SELECT id, channel_id as "channelId", user_id as "userId", username, avatar, role, content, COALESCE(media_url, '') as "mediaUrl", COALESCE(media_type, '') as "mediaType", created_at as "createdAt"
      FROM messages
      WHERE channel_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `, [channelId, limit]);

    res.json({ messages: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao carregar mensagens' });
  }
});

router.post('/:channelId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const user = req.user!;
    const { content, mediaUrl, mediaType } = req.body;

    if ((!content || !content.trim()) && !mediaUrl) {
      res.status(400).json({ error: 'A mensagem não pode estar vazia' });
      return;
    }

    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO messages (id, channel_id, user_id, username, avatar, role, content, media_url, media_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [messageId, channelId, user.id, user.username, user.avatar, user.role, content ? content.trim() : '', mediaUrl || '', mediaType || '', now]);

    const message: ChatMessage = {
      id: messageId,
      channelId,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      content: content ? content.trim() : '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || '',
      createdAt: now
    };

    const io = getIO();
    if (io) {
      io.to(channelId).emit('chat:message', { message });
      io.to(channelId).emit('chat:message_received', { message });
    }

    res.status(201).json({ message });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao enviar mensagem' });
  }
});

export default router;
