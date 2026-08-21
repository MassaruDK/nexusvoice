import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { User, SafeUser, JWTPayload } from '../types/index.js';

export const registerSchema = z.object({
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').max(30),
  email: z.string().regex(/^[^\s@]+@[^\s@]+$/, 'Email inválido').max(100),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email obrigatório'),
  password: z.string().min(1, 'Senha obrigatória')
});

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>): Promise<{ user: SafeUser; token: string }> {
    const existingEmail = await db.get<User>('SELECT id FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (existingEmail) {
      throw new Error('Este email já está cadastrado');
    }

    const existingUsername = await db.get<User>('SELECT id FROM users WHERE LOWER(username) = ?', [data.username.toLowerCase()]);
    if (existingUsername) {
      throw new Error('Este nome de usuário já está em uso');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const userId = crypto.randomUUID();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username)}&backgroundColor=0284c7,38bdf8,0ea5e9`;
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO users (id, username, email, password_hash, role, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'USER', ?, ?, ?)
    `, [userId, data.username, data.email.toLowerCase(), passwordHash, avatar, now, now]);

    const safeUser: SafeUser = {
      id: userId,
      username: data.username,
      email: data.email.toLowerCase(),
      role: 'USER',
      avatar,
      created_at: now,
      updated_at: now
    };

    const token = this.generateToken(safeUser);
    return { user: safeUser, token };
  }

  static async login(data: z.infer<typeof loginSchema>): Promise<{ user: SafeUser; token: string }> {
    const user = await db.get<User>('SELECT * FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    const isMatch = bcrypt.compareSync(data.password, user.password_hash || '');
    if (!isMatch) {
      throw new Error('Email ou senha inválidos');
    }

    const { password_hash, ...safeUser } = user;
    const token = this.generateToken(safeUser);
    return { user: safeUser, token };
  }

  static generateToken(user: SafeUser): string {
    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as any
    });
  }
}
