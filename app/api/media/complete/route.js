import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, audit } from '../../../../lib/db';
import { RELEASE_VERSION, VIDEO_MIME, rateLimit } from '../../../../lib/util';

const BLOB_HOST_RE = /^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\//;

export async function POST(request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!rateLimit('complete:' + ip, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many submissions — try again later.' }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }

  const { slug, name, email, ig, caption, athletes, files } = body || {};
  if (!slug || !name || !email || !Array.isArray(files) || files.length === 0 || files.length > 100) {
    return NextResponse.json({ ok: false, error: 'Name, email, and at least one file are required.' }, { status: 400 });
  }

  const sql = await db();
  const rows = await sql`SELECT id FROM events WHERE slug = ${slug} AND public_uploads = 1 AND status IN ('published','cancelled','archived')`;
  const event = rows[0];
  if (!event) return NextResponse.json({ ok: false, error: 'Uploads are not open for this event.' }, { status: 404 });

  const now = new Date().toISOString();
  let saved = 0;
  for (const f of files) {
    if (typeof f.url !== 'string' || !BLOB_HOST_RE.test(f.url)) continue; // only accept our blob store
    const mime = String(f.type || '');
    const kind = VIDEO_MIME.includes(mime) || /\.(mp4|mov|m4v|webm)$/i.test(f.name || '') ? 'video' : 'photo';
    await sql`INSERT INTO media (id, event_id, blob_url, original_name, mime, size, kind,
        uploader_name, uploader_email, uploader_ig, athletes, caption,
        release_accepted_at, release_version, uploader_ip, status)
      VALUES (${crypto.randomUUID()}, ${event.id}, ${f.url}, ${String(f.name || '').slice(0, 255)}, ${mime.slice(0, 100)},
        ${Number(f.size) || 0}, ${kind}, ${String(name).slice(0, 80)}, ${String(email).slice(0, 120)},
        ${String(ig || '').slice(0, 60)}, ${String(athletes || '').slice(0, 200)}, ${String(caption || '').slice(0, 200)},
        ${now}, ${RELEASE_VERSION}, ${ip}, 'pending')`;
    saved++;
  }
  if (!saved) return NextResponse.json({ ok: false, error: 'No valid files in submission.' }, { status: 400 });

  await audit(email, 'media.upload', 'event', event.id, `${saved} file(s) from ${name}`);
  return NextResponse.json({ ok: true, saved });
}
