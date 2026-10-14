// db.js - Persistent database abstraction supporting PostgreSQL and persistent SQLite
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbEngine = null; // 'postgresql' | 'sqlite'
let pgPool = null;
let sqliteDb = null;

/**
 * Initialize the persistent database connection and create tables
 */
export async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      console.log('[DB] Connecting to PostgreSQL database...');
      const { default: pg } = await import('pg');
      const { Pool } = pg;

      // Handle SSL for managed cloud databases (e.g. Render, Supabase, Neon)
      const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
      pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false }
      });

      // Verify connection
      const client = await pgPool.connect();
      client.release();
      dbEngine = 'postgresql';
      console.log('[DB] PostgreSQL connected successfully.');

      // Create users table
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          student_id VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'student',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
        CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(UPPER(student_id));
      `);
      console.log('[DB] PostgreSQL tables and indexes ready.');
      return { engine: 'postgresql', status: 'ready' };
    } catch (err) {
      console.error('[DB] PostgreSQL connection failed:', err.message);
      console.warn('[DB] Falling back to persistent SQLite database...');
    }
  }

  // Persistent SQLite fallback (stored in backend/data/transport_system.db)
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'transport_system.db');

    console.log(`[DB] Initializing persistent SQLite database at: ${dbPath}`);
    const { DatabaseSync } = await import('node:sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    dbEngine = 'sqlite';

    // Create users table and indexes
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
    `);
    console.log('[DB] SQLite persistent database ready.');
    return { engine: 'sqlite', status: 'ready' };
  } catch (err) {
    console.error('[DB] Failed to initialize SQLite database:', err.message);
    throw new Error(`Database initialization failed: ${err.message}`);
  }
}

/**
 * Find user by email (case-insensitive)
 */
export async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  if (dbEngine === 'postgresql') {
    const res = await pgPool.query(
      'SELECT id, name, email, student_id AS "studentId", password_hash AS "passwordHash", role, created_at AS "createdAt" FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [cleanEmail]
    );
    return res.rows[0] || null;
  } else if (dbEngine === 'sqlite') {
    const stmt = sqliteDb.prepare(
      'SELECT id, name, email, student_id AS studentId, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE LOWER(email) = ? LIMIT 1'
    );
    return stmt.get(cleanEmail) || null;
  }
  return null;
}

/**
 * Find user by student ID (case-insensitive)
 */
export async function findUserByStudentId(studentId) {
  if (!studentId) return null;
  const cleanId = studentId.toUpperCase().trim();

  if (dbEngine === 'postgresql') {
    const res = await pgPool.query(
      'SELECT id, name, email, student_id AS "studentId", password_hash AS "passwordHash", role, created_at AS "createdAt" FROM users WHERE UPPER(student_id) = $1 LIMIT 1',
      [cleanId]
    );
    return res.rows[0] || null;
  } else if (dbEngine === 'sqlite') {
    const stmt = sqliteDb.prepare(
      'SELECT id, name, email, student_id AS studentId, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE UPPER(student_id) = ? LIMIT 1'
    );
    return stmt.get(cleanId) || null;
  }
  return null;
}

/**
 * Find user by ID (excludes password_hash for safety)
 */
export async function findUserById(id) {
  if (!id) return null;

  if (dbEngine === 'postgresql') {
    const res = await pgPool.query(
      'SELECT id, name, email, student_id AS "studentId", role, created_at AS "createdAt" FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  } else if (dbEngine === 'sqlite') {
    const stmt = sqliteDb.prepare(
      'SELECT id, name, email, student_id AS studentId, role, created_at AS createdAt FROM users WHERE id = ? LIMIT 1'
    );
    return stmt.get(id) || null;
  }
  return null;
}

/**
 * Create a new user with hashed password
 */
export async function createUser({ name, email, studentId, passwordHash, role = 'student' }) {
  const cleanName = name.trim();
  const cleanEmail = email.toLowerCase().trim();
  const cleanStudentId = studentId.toUpperCase().trim();
  const cleanRole = role.toLowerCase().trim() || 'student';

  if (dbEngine === 'postgresql') {
    const res = await pgPool.query(
      `INSERT INTO users (name, email, student_id, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, student_id AS "studentId", role, created_at AS "createdAt"`,
      [cleanName, cleanEmail, cleanStudentId, passwordHash, cleanRole]
    );
    return res.rows[0];
  } else if (dbEngine === 'sqlite') {
    const insertStmt = sqliteDb.prepare(
      `INSERT INTO users (name, email, student_id, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = insertStmt.run(cleanName, cleanEmail, cleanStudentId, passwordHash, cleanRole);
    const selectStmt = sqliteDb.prepare(
      'SELECT id, name, email, student_id AS studentId, role, created_at AS createdAt FROM users WHERE id = ?'
    );
    return selectStmt.get(result.lastInsertRowid);
  }
  throw new Error('Database engine is not initialized');
}

/**
 * Get current database engine status
 */
export function getDatabaseInfo() {
  return {
    engine: dbEngine || 'uninitialized',
    status: dbEngine ? 'connected' : 'disconnected'
  };
}
