import Database from 'better-sqlite3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { initSchema } from './schema.js';
import { seedInitialData } from './seed.js';

const { Pool } = pg;

export type DBEngine = 'sqlite' | 'postgres';

export interface DatabaseAdapter {
  engine: DBEngine;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<{ changes?: number; lastInsertRowid?: number | bigint }>;
  exec(sql: string): Promise<void>;
}

class SQLiteAdapter implements DatabaseAdapter {
  engine: DBEngine = 'sqlite';
  private db: Database.Database;

  constructor(dbPath: string) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes?: number; lastInsertRowid?: number | bigint }> {
    const result = this.db.prepare(sql).run(...params);
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }
}

class PostgresAdapter implements DatabaseAdapter {
  engine: DBEngine = 'postgres';
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  private convertPlaceholders(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pgSql = this.convertPlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const pgSql = this.convertPlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows[0] as T | undefined;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes?: number }> {
    const pgSql = this.convertPlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return { changes: result.rowCount || 0 };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }
}

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

export const db: DatabaseAdapter = (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))
  ? new PostgresAdapter(databaseUrl)
  : new SQLiteAdapter(config.DB_PATH);

console.log(`[DATABASE] Conectado ao banco de dados (${db.engine.toUpperCase()})`);

// Inicializa esquema e seed de forma assíncrona
(async () => {
  try {
    await initSchema(db);
    await seedInitialData(db);
  } catch (err: any) {
    console.error('[DATABASE_INIT_ERROR]', err.message);
  }
})();
