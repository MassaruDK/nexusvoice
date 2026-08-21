import { Router, Request, Response } from 'express';
import {
  ChannelService,
  createChannelSchema,
  updateChannelSchema,
  reorderChannelsSchema
} from '../services/channelService.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { getIO } from '../socket/index.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const channels = await ChannelService.getAll();
    res.json({ channels });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar canais' });
  }
});

router.post('/', requireAuth, requireAdmin, validateBody(createChannelSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const channel = await ChannelService.create(req.body);
    const io = getIO();
    if (io) {
      io.emit('channel:created', { channel });
    }
    res.status(201).json({ channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao criar canal' });
  }
});

router.patch('/:id', requireAuth, requireAdmin, validateBody(updateChannelSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const channel = await ChannelService.update(req.params.id as string, req.body);
    const io = getIO();
    if (io) {
      io.emit('channel:updated', { channel });
    }
    res.json({ channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar canal' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const channelId = req.params.id as string;
    await ChannelService.delete(channelId);
    const io = getIO();
    if (io) {
      io.emit('channel:deleted', { channelId });
    }
    res.json({ success: true, message: 'Canal excluído com sucesso' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir canal' });
  }
});

router.put('/reorder', requireAuth, requireAdmin, validateBody(reorderChannelsSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const channels = await ChannelService.reorder(req.body.orderedIds);
    const io = getIO();
    if (io) {
      io.emit('channel:reordered', { channels });
    }
    res.json({ channels });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao reordenar canais' });
  }
});

export default router;
