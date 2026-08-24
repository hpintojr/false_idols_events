import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, audit } from '../../../lib/db';
import { currentUser } from '../../../lib/auth';
import { slugify } from '../../../lib/util';
import { sanitizeEvent } from '../../../lib/eventSanitize';

export async function POST(request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const v = sanitizeEvent(body);
  if (v.error) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

  const sql = await db();
  const id = crypto.randomUUID();
  let slug = slugify(v.name);
  let n = 2;
  while ((await sql`SELECT 1 FROM events WHERE slug = ${slug}`).length) slug = `${slugify(v.name)}-${n++}`;

  // Staff-created events wait for admin approval; admin-created events publish immediately.
  const status = user.role === 'admin' ? 'published' : 'submitted';

  await sql`INSERT INTO events (id, slug, name, description, category, start_at, end_at, venue, address, city, state,
      ticket_url, ig_url, notes, featured, public_uploads, flyer_url, status, submitted_by)
    VALUES (${id}, ${slug}, ${v.name}, ${v.description}, ${v.category}, ${v.start_at}, ${v.end_at}, ${v.venue}, ${v.address},
      ${v.city}, ${v.state}, ${v.ticket_url}, ${v.ig_url}, ${v.notes}, ${v.featured}, ${v.public_uploads}, ${v.flyer_url},
      ${status}, ${user.id})`;
  await audit(user.email, 'event.create', 'event', id, `status=${status}`);
  return NextResponse.json({ ok: true, id, slug, status });
}
