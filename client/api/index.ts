import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aS07gMCecqYw@ep-hidden-glitter-acra0pq3-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_nexus_voice_production_2026';
const COOKIE_NAME = 'auth_token';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

// Auto migrate columns
async function initDb() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT \'\';');
    await pool.query('ALTER TABLE voice_channels ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT \'VOICE\';');
    await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT \'\';');
    await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT \'\';');

    // Seed default text channels if none exist
    const textCheck = await pool.query("SELECT COUNT(*) as count FROM voice_channels WHERE type = 'TEXT'");
    if (parseInt(textCheck.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO voice_channels (id, name, description, position, type) VALUES
        ('text-geral', 'geral', 'Canal de texto principal para conversar', 0, 'TEXT'),
        ('text-anuncios', 'anúncios', 'Novidades e comunicados importantes', 1, 'TEXT'),
        ('text-midia', 'memes-e-mídia', 'Envie fotos, vídeos, prints e memes', 2, 'TEXT'),
        ('text-batepapo', 'bate-papo', 'Conversa livre entre membros', 3, 'TEXT')
        ON CONFLICT (id) DO NOTHING;
      `);
    }
  } catch (err) {
    console.warn('[DB_INIT_WARN]', err);
  }
}
initDb();

const app = express();

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Bypass-Tunnel-Reminder']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    res.status(401).json({ error: 'Não autorizado: Sessão não encontrada ou expirada' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const result = await pool.query(
      'SELECT id, username, email, role, avatar, bio, created_at, updated_at FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as now');
    res.json({ status: 'ok', database: 'neon_postgres', time: dbRes.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}&backgroundColor=0284c7,38bdf8,0ea5e9`;

    await pool.query(
      'INSERT INTO users (id, username, email, password_hash, role, avatar, bio) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, username, email.toLowerCase(), passwordHash, 'USER', avatar, '']
    );

    const safeUser = { id: userId, username, email: email.toLowerCase(), role: 'USER', avatar, bio: '' };
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao cadastrar' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe email e senha' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Email ou senha inválidos' });
    }

    const { password_hash, ...safeUser } = user;
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao fazer login' });
  }
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

app.patch('/api/auth/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { username, avatar, bio } = req.body;

    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), avatar = COALESCE($2, avatar), bio = COALESCE($3, bio), updated_at = NOW() WHERE id = $4 RETURNING id, username, email, role, avatar, bio, created_at, updated_at',
      [
        username ? username.trim() : null,
        avatar ? avatar.trim() : null,
        bio !== undefined ? bio.trim() : null,
        user.id
      ]
    );

    const updatedUser = result.rows[0];
    const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: updatedUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar perfil' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'none', secure: true });
  res.json({ success: true });
});

app.get('/api/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name, description, position, COALESCE(type, \'VOICE\') as type, created_at as "createdAt", updated_at as "updatedAt" FROM voice_channels ORDER BY position ASC, created_at ASC');
    res.json({ channels: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao carregar canais' });
  }
});

app.post('/api/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado: Apenas administradores podem criar canais' });
    }

    const { name, description, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

    const channelType = type === 'TEXT' ? 'TEXT' : 'VOICE';
    const maxPos = await pool.query('SELECT MAX(position) as max_pos FROM voice_channels WHERE type = $1', [channelType]);
    const pos = (maxPos.rows[0]?.max_pos !== null && maxPos.rows[0]?.max_pos !== undefined) ? Number(maxPos.rows[0].max_pos) + 1 : 0;
    const channelId = crypto.randomUUID();

    const insert = await pool.query(
      'INSERT INTO voice_channels (id, name, description, position, type) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, position, type, created_at as "createdAt", updated_at as "updatedAt"',
      [channelId, name, description || '', pos, channelType]
    );

    res.status(201).json({ channel: insert.rows[0] });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao criar canal' });
  }
});

app.delete('/api/channels/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    await pool.query('DELETE FROM voice_channels WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Canal excluído' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/messages/:channelId - Obter Histórico de Mensagens
app.get('/api/messages/:channelId', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, channel_id as "channelId", user_id as "userId", username, avatar, role, content, COALESCE(media_url, \'\') as "mediaUrl", COALESCE(media_type, \'\') as "mediaType", created_at as "createdAt" FROM messages WHERE channel_id = $1 ORDER BY created_at ASC LIMIT 100',
      [req.params.channelId]
    );
    res.json({ messages: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:channelId - Enviar Nova Mensagem (com suporte a Imagem/Vídeo)
app.post('/api/messages/:channelId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { content, mediaUrl, mediaType } = req.body;

    if ((!content || !content.trim()) && !mediaUrl) {
      return res.status(400).json({ error: 'A mensagem não pode estar vazia' });
    }

    const messageId = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO messages (id, channel_id, user_id, username, avatar, role, content, media_url, media_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, channel_id as "channelId", user_id as "userId", username, avatar, role, content, media_url as "mediaUrl", media_type as "mediaType", created_at as "createdAt"',
      [
        messageId,
        req.params.channelId,
        user.id,
        user.username,
        user.avatar,
        user.role,
        content ? content.trim() : '',
        mediaUrl || '',
        mediaType || ''
      ]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao enviar mensagem' });
  }
});

export default app;
