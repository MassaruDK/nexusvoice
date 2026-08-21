import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { db } from './db/index.js';
import { initSocketIO } from './socket/index.js';
import authRoutes from './routes/auth.js';
import channelRoutes from './routes/channels.js';
import messageRoutes from './routes/messages.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requireAuth } from './middlewares/auth.js';
import { AuthService } from './services/authService.js';

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Bypass-Tunnel-Reminder']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, async (req, res) => {
  try {
    const users = await AuthService.getAllUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);

// Error Handler
app.use(errorHandler);

// Inicializa WebSocket
initSocketIO(server);

server.listen(config.PORT, () => {
  console.log(`[SERVER] Nexus Voice Server rodando na porta ${config.PORT}`);
});
