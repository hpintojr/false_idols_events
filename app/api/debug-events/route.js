import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = await db();
    const raw = await sql`SELECT id, slug, status, length(status) AS len, encode(status::bytea, 'hex') AS hex FROM events ORDER BY start_at ASC`;
    const exact = await sql`SELECT id FROM events WHERE status = 'published'`;
    const inList = await sql`SELECT id FROM events WHERE status IN ('published','cancelled')`;
    const like = await sql`SELECT id FROM events WHERE status LIKE 'published%'`;
    return Response.json({ raw, exactCount: exact.length, inListCount: inList.length, likeCount: like.length });
  } catch (e) {
    return Response.json({ error: String(e), stack: e.stack }, { status: 500 });
  }
}
