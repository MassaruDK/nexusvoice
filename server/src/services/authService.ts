import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { User } from '../types/index.js';

export const registerSchema = z.object({
  username: z.string().min(2, 'Nome de usuário deve ter pelo menos 2 caracteres').max(32),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export const updateProfileSchema = z.object({
  username: z.string().min(2).max(32).optional(),
  avatar: z.string().optional(),
  bio: z.string().max(160).optional()
});

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>): Promise<{ user: User; token: string }> {
    const existing = await db.get<User>('SELECT id FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (existing) {
      throw new Error('Este email já está cadastrado');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username)}&backgroundColor=0284c7,38bdf8,0ea5e9`;

    await db.run(`
      INSERT INTO users (id, username, email, password_hash, role, avatar, bio, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, data.username, data.email.toLowerCase(), passwordHash, 'USER', avatar, '', now, now]);

    const user: User = {
      id: userId,
      username: data.username,
      email: data.email.toLowerCase(),
      role: 'USER',
      avatar,
      bio: '',
      created_at: now,
      updated_at: now
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  static async login(data: z.infer<typeof loginSchema>): Promise<{ user: User; token: string }> {
    const user = await db.get<User & { password_hash: string }>('SELECT * FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    const isValid = bcrypt.compareSync(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Email ou senha inválidos');
    }

    const { password_hash, ...safeUser } = user;
    const token = this.generateToken(safeUser as User);

    return { user: safeUser as User, token };
  }

  static async updateProfile(userId: string, data: z.infer<typeof updateProfileSchema>): Promise<{ user: User; token: string }> {
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('Usuário não encontrado');

    const username = data.username ? data.username.trim() : user.username;
    const avatar = data.avatar ? data.avatar.trim() : user.avatar;
    const bio = data.bio !== undefined ? data.bio.trim() : (user.bio || '');
    const now = new Date().toISOString();

    await db.run(`
      UPDATE users SET username = ?, avatar = ?, bio = ?, updated_at = ? WHERE id = ?
    `, [username, avatar, bio, now, userId]);

    // Cascata para as mensagens
    await db.run(`
      UPDATE messages SET username = ?, avatar = ? WHERE user_id = ?
    `, [username, avatar, userId]).catch(() => {});

    const updatedUser: User = {
      ...user,
      username,
      avatar,
      bio,
      updated_at: now
    };

    const token = this.generateToken(updatedUser);
    return { user: updatedUser, token };
  }

  static async getAllUsers(): Promise<User[]> {
    return db.query<User>('SELECT id, username, email, role, avatar, bio, created_at, updated_at FROM users ORDER BY role ASC, username ASC');
  }

  static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio || ''
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}
