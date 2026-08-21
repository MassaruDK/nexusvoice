import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DatabaseAdapter } from './index.js';
import { config } from '../config.js';

export async function seedInitialData(db: DatabaseAdapter): Promise<void> {
  const existingAdmin = await db.get<{ id: string }>('SELECT id FROM users WHERE role = ? LIMIT 1', ['ADMIN']);
  
  if (!existingAdmin) {
    console.log('[DATABASE] Criando ADMIN inicial...');
    const adminId = crypto.randomUUID();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(config.ADMIN_PASSWORD, salt);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(config.ADMIN_USERNAME)}&backgroundColor=0284c7`;
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO users (id, username, email, password_hash, role, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?)
    `, [adminId, config.ADMIN_USERNAME, config.ADMIN_EMAIL, passwordHash, avatar, now, now]);

    console.log(`[DATABASE] ADMIN inicial criado com sucesso: ${config.ADMIN_EMAIL}`);
  }

  // Verificar se o amigo teste existe
  const friend = await db.get<{ id: string }>('SELECT id FROM users WHERE email = ?', ['amigo@nexusvoice.com']);
  if (!friend) {
    const friendId = crypto.randomUUID();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('nexus123456', salt);
    const avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=amigo&backgroundColor=0284c7,38bdf8,0ea5e9';
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO users (id, username, email, password_hash, role, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'USER', ?, ?, ?)
    `, [friendId, 'amigo', 'amigo@nexusvoice.com', passwordHash, avatar, now, now]);
    console.log('[DATABASE] Usuário amigo@nexusvoice.com criado.');
  }

  const channelCount = await db.get<{ count: number | string }>('SELECT COUNT(*) as count FROM voice_channels');
  const count = channelCount ? parseInt(channelCount.count.toString(), 10) : 0;
  
  if (count === 0) {
    console.log('[DATABASE] Criando canais de voz padrão...');
    const defaultChannels = [
      { name: 'Geral', description: 'Canal principal para conversas gerais e reuniões', position: 0 },
      { name: 'Lounge', description: 'Espaço descontraído para bater papo e relaxar', position: 1 },
      { name: 'Games', description: 'Canal dedicado a jogatinas e transmissões', position: 2 },
      { name: 'Madrugada', description: 'Para quem vara a noite conversando', position: 3 }
    ];

    const now = new Date().toISOString();
    for (const ch of defaultChannels) {
      await db.run(`
        INSERT INTO voice_channels (id, name, description, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [crypto.randomUUID(), ch.name, ch.description, ch.position, now, now]);
    }
    console.log('[DATABASE] Canais padrão criados.');
  }
}
