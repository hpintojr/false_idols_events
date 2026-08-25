import { put } from '@vercel/blob';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { eventId, url } = await request.json();
    if (!eventId || !url) return Response.json({ error: 'missing eventId or url' }, { status: 400 });
    const imgRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
      },
    });
    if (!imgRes.ok) return Response.json({ error: 'fetch failed: ' + imgRes.status }, { status: 500 });
    const buf = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const blob = await put(`flyers/ig-${eventId}-${Date.now()}.jpg`, Buffer.from(buf), {
      access: 'public',
      addRandomSuffix: true,
      contentType,
    });
    const sql = await db();
    await sql`UPDATE events SET flyer_url = ${blob.url}, updated_at = now() WHERE id = ${eventId}`;
    return Response.json({ ok: true, url: blob.url, bytes: buf.byteLength });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
