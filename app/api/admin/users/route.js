import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, audit } from '../../../../lib/db';
import { currentUser, hashPassword } from '../../../../lib/auth';
import { USER_ROLES } from '../../../../lib/util';

export async function POST(request) {
  const user = await currentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const name = String(body.name || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const password = String(body.password || '');
  const role = USER_ROLES.includes(body.role) ? body.role : 'user';

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'A valid name and email are required.' }, { status: 400 });
  }
  if (password.length < 8) return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters.' }, { status: 400 });

  const sql = await db();
  const existing = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (existing.length) return NextResponse.json({ ok: false, error: 'A user with that email already exists.' }, { status: 400 });

  const id = crypto.randomUUID();
  await sql`INSERT INTO users (id, name, email, password_hash, role) VALUES (${id}, ${name}, ${email}, ${hashPassword(password)}, ${role})`;
  await audit(user.email, 'user.create', 'user', id, `role=${role}`);
  return NextResponse.json({ ok: true, id });
}
