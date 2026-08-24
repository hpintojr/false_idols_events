import { NextResponse } from 'next/server';
import { authenticate, signSession, SESSION_COOKIE } from '../../../lib/auth';
import { audit } from '../../../lib/db';
import { rateLimit } from '../../../lib/util';

export async function POST(request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const form = await request.formData();
  const email = String(form.get('email') || '');
  const password = String(form.get('password') || '');

  if (!rateLimit('login:' + ip, 15, 15 * 60 * 1000)) {
    return NextResponse.redirect(new URL('/admin/login?err=rate', request.url), 303);
  }

  const user = await authenticate(email, password);
  if (!user) {
    await audit(email, 'login.fail', null, null, ip);
    return NextResponse.redirect(new URL('/admin/login?err=1', request.url), 303);
  }

  await audit(user.email, 'login.ok', 'user', user.id, ip);
  const res = NextResponse.redirect(new URL('/admin', request.url), 303);
  res.cookies.set(SESSION_COOKIE.name, signSession(user), SESSION_COOKIE.options);
  return res;
}
