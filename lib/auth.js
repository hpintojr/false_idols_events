import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

function secret() {
  if (process.env.FI_SECRET) return process.env.FI_SECRET;
  // Deterministic fallback so sessions survive across serverless instances even without FI_SECRET.
  return crypto.createHash('sha256').update('fi-session:' + (process.env.DATABASE_URL || 'dev')).digest('hex');
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

const SESSION_MS = 1000 * 60 * 60 * 24 * 7;

export function signSession(user) {
  const body = Buffer.from(JSON.stringify({ uid: user.id, exp: Date.now() + SESSION_MS })).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifySession(token) {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i === -1) return null;
  const body = token.slice(0, i);
  const mac = token.slice(i + 1);
  const expect = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (mac.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

export const SESSION_COOKIE = {
  name: 'fi_session',
  options: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_MS / 1000 },
};

/** Logged-in user (server components + route handlers). Returns null for suspended accounts. */
export async function currentUser() {
  const token = cookies().get('fi_session')?.value;
  const payload = verifySession(token);
  if (!payload) return null;
  const sql = await db();
  const rows = await sql`SELECT id, name, email, role FROM users WHERE id = ${payload.uid}`;
  const user = rows[0];
  if (!user || user.role === 'suspended') return null;
  return user;
}

export async function authenticate(email, password) {
  const sql = await db();
  const rows = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase()}`;
  const user = rows[0];
  if (!user) return null;
  if (user.role === 'suspended') return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  return user;
}
