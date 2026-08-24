import { NextResponse } from 'next/server';
import { db, audit } from '../../../../lib/db';
import { currentUser } from '../../../../lib/auth';
import { MEDIA_STATUSES } from '../../../../lib/util';

export async function POST(request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL('/admin/login', request.url), 303);

  const form = await request.formData();
  const id = String(form.get('id') || '');
  const status = String(form.get('status') || '');
  const back = String(form.get('back') || '/admin/media');
  if (!id || !MEDIA_STATUSES.includes(status)) {
    return NextResponse.redirect(new URL('/admin/media', request.url), 303);
  }

  const sql = await db();
  const rows = await sql`SELECT id, original_name FROM media WHERE id = ${id}`;
  if (rows[0]) {
    await sql`UPDATE media SET status = ${status} WHERE id = ${id}`;
    await audit(user.email, `media.${status}`, 'media', id, rows[0].original_name);
  }
  const dest = back.startsWith('/admin') ? back : '/admin/media';
  return NextResponse.redirect(new URL(dest, request.url), 303);
}
