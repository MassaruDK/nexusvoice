import { Router, Request, Response } from 'express';
import { AuthService, registerSchema, loginSchema } from '../services/authService.js';
import { validateBody } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { config } from '../config.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post('/register', authLimiter, validateBody(registerSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, token } = await AuthService.register(req.body);
    res.cookie(config.COOKIE_NAME, token, COOKIE_OPTIONS);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar usuário' });
  }
});

router.post('/login', authLimiter, validateBody(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, token } = await AuthService.login(req.body);
    res.cookie(config.COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao realizar login' });
  }
});

router.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie(config.COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

export default router;
