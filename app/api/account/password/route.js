import { NextResponse } from 'next/server';
import { db, audit } from '../../../../lib/db';
import { currentUser, verifyPassword, hashPassword } from '../../../../lib/auth';

export async function POST(request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const currentPassword = String(body.current_password || '');
  const newPassword = String(body.new_password || '');
  if (newPassword.length < 8) return NextResponse.json({ ok: false, error: 'New password must be at least 8 characters.' }, { status: 400 });

  const sql = await db();
  const rows = await sql`SELECT * FROM users WHERE id = ${user.id}`;
  const full = rows[0];
  if (!full || !verifyPassword(currentPassword, full.password_hash)) {
    return NextResponse.json({ ok: false, error: 'Current password is incorrect.' }, { status: 400 });
  }

  await sql`UPDATE users SET password_hash = ${hashPassword(newPassword)} WHERE id = ${user.id}`;
  await audit(user.email, 'user.password_change_self', 'user', user.id, null);
  return NextResponse.json({ ok: true });
}
