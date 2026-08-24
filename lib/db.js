import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

let _sql = null;
let _ready = null;

function client() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set — add the Neon integration in Vercel.');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

async function init(sql) {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Other',
    start_at TEXT NOT NULL,
    end_at TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    venue TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    flyer_url TEXT,
    ticket_url TEXT NOT NULL DEFAULT '',
    ig_url TEXT NOT NULL DEFAULT '',
    featured INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    public_uploads INT NOT NULL DEFAULT 1,
    notes TEXT NOT NULL DEFAULT '',
    submitted_by TEXT,
    ghl_calendar_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`;
  await sql`CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    blob_url TEXT NOT NULL,
    original_name TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL DEFAULT '',
    size BIGINT NOT NULL DEFAULT 0,
    kind TEXT NOT NULL DEFAULT 'photo',
    uploader_name TEXT NOT NULL DEFAULT '',
    uploader_email TEXT NOT NULL DEFAULT '',
    uploader_ig TEXT NOT NULL DEFAULT '',
    athletes TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '',
    release_accepted_at TEXT,
    release_version TEXT NOT NULL DEFAULT 'v1',
    uploader_ip TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_event ON media(event_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_status ON media(status)`;
  await sql`CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  // First-boot admin from env vars
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM users`;
  if (n === 0 && process.env.FI_ADMIN_EMAIL && process.env.FI_ADMIN_PASSWORD) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(process.env.FI_ADMIN_PASSWORD, salt, 64).toString('hex');
    await sql`INSERT INTO users (id, name, email, password_hash, role)
      VALUES (${crypto.randomUUID()}, ${process.env.FI_ADMIN_NAME || 'Admin'}, ${process.env.FI_ADMIN_EMAIL.toLowerCase()}, ${salt + ':' + hash}, 'admin')
      ON CONFLICT (email) DO NOTHING`;
  }
}

/** Get the ready-to-use sql tagged-template client (schema ensured once per instance). */
export async function db() {
  const sql = client();
  if (!_ready) _ready = init(sql);
  await _ready;
  return sql;
}

export async function audit(actor, action, entity, entityId, detail) {
  try {
    const sql = await db();
    await sql`INSERT INTO audit_log (actor, action, entity, entity_id, detail)
      VALUES (${actor || null}, ${action}, ${entity || null}, ${entityId || null}, ${detail || null})`;
  } catch (e) { console.error('audit failed', e); }
}
