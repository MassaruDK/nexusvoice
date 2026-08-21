import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_webrtc_voice_platform_2026',
  JWT_EXPIRES_IN: '7d',
  COOKIE_NAME: 'auth_token',
  
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@localhost',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'change-me',
  
  DB_PATH: process.env.DB_PATH 
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), 'data/app.db'),
    
  CORS_ORIGIN: process.env.CLIENT_URL || 'http://localhost:5173'
};
