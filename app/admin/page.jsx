import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '../../lib/db';
import { currentUser } from '../../lib/auth';
import { nowIso, fmtDate } from '../../lib/util';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  const sql = await db();
  const today = nowIso().slice(0, 10);
  const one = async (q) => (await q)[0].n;

  const stats = [
    ['UPCOMING EVENTS', await one(sql`SELECT COUNT(*)::int n FROM events WHERE status = 'published' AND COALESCE(end_at, start_at) >= ${today}`)],
    ['AWAITING APPROVAL', await one(sql`SELECT COUNT(*)::int n FROM events WHERE status = 'submitted'`)],
    ['PAST EVENTS', await one(sql`SELECT COUNT(*)::int n FROM events WHERE status IN ('published','archived') AND COALESCE(end_at, start_at) < ${today}`)],
    ['MEDIA PENDING REVIEW', await one(sql`SELECT COUNT(*)::int n FROM media WHERE status = 'pending'`)],
    ['MEDIA APPROVED', await one(sql`SELECT COUNT(*)::int n FROM media WHERE status IN ('approved','featured')`)],
    ['TEAM USERS', await one(sql`SELECT COUNT(*)::int n FROM users`)],
  ];
  const pendingEvents = await sql`SELECT * FROM events WHERE status = 'submitted' ORDER BY start_at LIMIT 8`;
  const pendingMedia = await one(sql`SELECT COUNT(*)::int n FROM media WHERE status = 'pending'`);

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><div className="kicker">FALSE IDOLS HQ</div><h1>DASHBOARD</h1></div>
      <div className="stat-grid">
        {stats.map(([l, n]) => <div className="stat" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>)}
      </div>

      <h2><span className="bar">/</span> NEEDS ATTENTION</h2>
      {pendingEvents.length ? (
        <div className="table-wrap"><table className="list"><tbody>
          <tr><th>Event</th><th>Date</th><th></th></tr>
          {pendingEvents.map((e) => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td>{fmtDate(e.start_at)}</td>
              <td><Link className="btn btn-sm" href={`/admin/events/${e.id}/edit`}>REVIEW</Link></td>
            </tr>
          ))}
        </tbody></table></div>
      ) : <p className="muted">No event submissions waiting.</p>}
      {pendingMedia > 0 && (
        <p style={{ marginTop: 14 }}><Link className="btn btn-ghost" href="/admin/media?status=pending">REVIEW {pendingMedia} PENDING MEDIA →</Link></p>
      )}

      <div className="cta-row" style={{ marginTop: 30 }}>
        <Link className="btn" href="/admin/events/new">+ CREATE EVENT</Link>
        <Link className="btn btn-ghost" href="/admin/events">MANAGE EVENTS</Link>
        <Link className="btn btn-ghost" href="/admin/media">MEDIA VAULT</Link>
      </div>
    </>
  );
}
