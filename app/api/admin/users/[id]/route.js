import { NextResponse } from 'next/server';
import { db, audit } from '../../../../../lib/db';
import { currentUser, hashPassword } from '../../../../../lib/auth';
import { USER_ROLES } from '../../../../../lib/util';

export async function PATCH(request, { params }) {
  const user = await currentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }

  const sql = await db();
  const rows = await sql`SELECT * FROM users WHERE id = ${params.id}`;
  const target = rows[0];
  if (!target) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  if (typeof body.role === 'string') {
    if (target.id === user.id) return NextResponse.json({ ok: false, error: "You can't change your own access level." }, { status: 400 });
    if (!USER_ROLES.includes(body.role)) return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
    await sql`UPDATE users SET role = ${body.role} WHERE id = ${target.id}`;
    await audit(user.email, 'user.role_change', 'user', target.id, `role=${body.role}`);
  }

  if (typeof body.password === 'string') {
    if (body.password.length < 8) return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    await sql`UPDATE users SET password_hash = ${hashPassword(body.password)} WHERE id = ${target.id}`;
    await audit(user.email, 'user.password_reset', 'user', target.id, null);
  }

  return NextResponse.json({ ok: true });
}
