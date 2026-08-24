import { NextResponse } from 'next/server';

export async function POST(request) {
  const res = NextResponse.redirect(new URL('/admin/login', request.url), 303);
  res.cookies.set('fi_session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
