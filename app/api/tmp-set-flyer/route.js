import { put } from '@vercel/blob';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const form = await request.formData();
    const eventId = form.get('eventId');
    const file = form.get('file');
    if (!eventId || !file) return Response.json({ error: 'missing eventId or file' }, { status: 400 });
    const blob = await put(`flyers/${file.name}`, file, { access: 'public', addRandomSuffix: true });
    const sql = await db();
    await sql`UPDATE events SET flyer_url = ${blob.url}, updated_at = now() WHERE id = ${eventId}`;
    return Response.json({ ok: true, url: blob.url });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
