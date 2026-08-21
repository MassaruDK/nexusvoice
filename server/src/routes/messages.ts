import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { ChatMessage } from '../types/index.js';

const router = Router();

router.get('/:channelId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const limit = parseInt(req.query.limit as string || '50', 10);

    const rows = await db.query<ChatMessage>(`
      SELECT id, channel_id as "channelId", user_id as "userId", username, avatar, role, content, created_at as "createdAt"
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

export default router;
