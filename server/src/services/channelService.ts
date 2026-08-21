import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db/index.js';
import { VoiceChannel } from '../types/index.js';

export const createChannelSchema = z.object({
  name: z.string().min(1, 'Nome do canal é obrigatório').max(100),
  description: z.string().max(255).optional().default('')
});

export const updateChannelSchema = z.object({
  name: z.string().min(1, 'Nome do canal não pode ser vazio').max(100).optional(),
  description: z.string().max(255).optional(),
  position: z.number().int().min(0).optional()
});

export const reorderChannelsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, 'Lista de canais obrigatória')
});

export class ChannelService {
  static async getAll(): Promise<VoiceChannel[]> {
    return db.query<VoiceChannel>('SELECT * FROM voice_channels ORDER BY position ASC, created_at ASC');
  }

  static async getById(id: string): Promise<VoiceChannel | null> {
    const channel = await db.get<VoiceChannel>('SELECT * FROM voice_channels WHERE id = ?', [id]);
    return channel || null;
  }

  static async create(data: z.infer<typeof createChannelSchema>): Promise<VoiceChannel> {
    const maxPosRow = await db.get<{ maxPos: number | null }>('SELECT MAX(position) as maxPos FROM voice_channels');
    const nextPosition = (maxPosRow && maxPosRow.maxPos !== null) ? Number(maxPosRow.maxPos) + 1 : 0;

    const channelId = crypto.randomUUID();
    const now = new Date().toISOString();
    const description = data.description || '';

    await db.run(`
      INSERT INTO voice_channels (id, name, description, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [channelId, data.name, description, nextPosition, now, now]);

    return {
      id: channelId,
      name: data.name,
      description,
      position: nextPosition,
      created_at: now,
      updated_at: now
    };
  }

  static async update(id: string, data: z.infer<typeof updateChannelSchema>): Promise<VoiceChannel> {
    const channel = await this.getById(id);
    if (!channel) {
      throw new Error('Canal de voz não encontrado');
    }

    const name = data.name !== undefined ? data.name : channel.name;
    const description = data.description !== undefined ? data.description : channel.description;
    const position = data.position !== undefined ? data.position : channel.position;
    const now = new Date().toISOString();

    await db.run(`
      UPDATE voice_channels 
      SET name = ?, description = ?, position = ?, updated_at = ?
      WHERE id = ?
    `, [name, description, position, now, id]);

    return {
      ...channel,
      name,
      description,
      position,
      updated_at: now
    };
  }

  static async delete(id: string): Promise<void> {
    const channel = await this.getById(id);
    if (!channel) {
      throw new Error('Canal de voz não encontrado');
    }

    await db.run('DELETE FROM voice_channels WHERE id = ?', [id]);
  }

  static async reorder(orderedIds: string[]): Promise<VoiceChannel[]> {
    const now = new Date().toISOString();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.run('UPDATE voice_channels SET position = ?, updated_at = ? WHERE id = ?', [i, now, orderedIds[i]]);
    }

    return this.getAll();
  }
}
