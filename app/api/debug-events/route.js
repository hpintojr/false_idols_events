import { db } from '../../../lib/db';
import { nowIso } from '../../../lib/util';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = await db();
    const all = await sql`SELECT id, slug, name, status, start_at, end_at, featured FROM events ORDER BY start_at ASC`;
    const now = nowIso();
    return Response.json({ now, count: all.length, all });
  } catch (e) {
    return Response.json({ error: String(e), stack: e.stack }, { status: 500 });
  }
}
