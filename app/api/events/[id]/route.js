import { NextResponse } from 'next/server';
import { db, audit } from '../../../../lib/db';
import { currentUser } from '../../../../lib/auth';
import { EVENT_STATUSES } from '../../../../lib/util';
import { sanitizeEvent } from '../../../../lib/eventSanitize';

export async function POST(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 401 });

  const sql = await db();
  const rows = await sql`SELECT * FROM events WHERE id = ${params.id}`;
  const existing = rows[0];
  if (!existing) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const v = sanitizeEvent(body);
  if (v.error) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

  // Keep existing flyer unless a new one was uploaded
  const flyerUrl = v.flyer_provided ? v.flyer_url : existing.flyer_url;

  // Status transitions: admin can set anything; staff may only submit a draft.
  let status = existing.status;
  const wanted = String(body.set_status || '');
  if (wanted && EVENT_STATUSES.includes(wanted)) {
    if (user.role === 'admin') status = wanted;
    else if (wanted === 'submitted' && existing.status === 'draft') status = wanted;
  }

  await sql`UPDATE events SET
      name = ${v.name}, description = ${v.description}, category = ${v.category},
      start_at = ${v.start_at}, end_at = ${v.end_at}, venue = ${v.venue}, address = ${v.address},
      city = ${v.city}, state = ${v.state}, ticket_url = ${v.ticket_url}, ig_url = ${v.ig_url},
      notes = ${v.notes}, featured = ${v.featured}, public_uploads = ${v.public_uploads},
      flyer_url = ${flyerUrl}, status = ${status}, updated_at = now()
    WHERE id = ${existing.id}`;
  await audit(user.email, 'event.update', 'event', existing.id, `status=${status}`);
  return NextResponse.json({ ok: true, status });
}
