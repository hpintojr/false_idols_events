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
  const isAdmin = user.role === 'admin';

  const sql = await db();
  const today = nowIso().slice(0, 10);
  const one = async (q) => (await q)[0].n;

  const stats = isAdmin ? [
    ['UPCOMING EVENTS', await one(sql`SELECT COUNT(*)::int n FROM events WHERE status = 'published' AND COALESCE(end_at, start_at) >= ${today}`)],
    ['AWAITING APPROVAL', await one(sql`SELECT COUNT(*)::int n FROM events WHERE status = 'submitted'`)],
    ['PAST EVENTS', await one(sql`SELECT COUNT(*)::int n FROM events WHERE status IN ('published','archived') AND COALESCE(end_at, start_at) < ${today}`)],
    ['MEDIA PENDING REVIEW', await one(sql`SELECT COUNT(*)::int n FROM media WHERE status = 'pending'`)],
    ['MEDIA APPROVED', await one(sql`SELECT COUNT(*)::int n FROM media WHERE status IN ('approved','featured')`)],
    ['TEAM USERS', await one(sql`SELECT COUNT(*)::int n FROM users`)],
  ] : [
    ['MY EVENTS', await one(sql`SELECT COUNT(*)::int n FROM events WHERE submitted_by = ${user.id}`)],
    ['AWAITING APPROVAL', await one(sql`SELECT COUNT(*)::int n FROM events WHERE submitted_by = ${user.id} AND status = 'submitted'`)],
    ['PUBLISHED', await one(sql`SELECT COUNT(*)::int n FROM events WHERE submitted_by = ${user.id} AND status = 'published'`)],
  ];

  const pendingEvents = isAdmin
    ? await sql`SELECT * FROM events WHERE status = 'submitted' ORDER BY start_at LIMIT 8`
    : await sql`SELECT * FROM events WHERE submitted_by = ${user.id} AND status = 'submitted' ORDER BY start_at LIMIT 8`;
  const pendingMedia = isAdmin ? await one(sql`SELECT COUNT(*)::int n FROM media WHERE status = 'pending'`) : 0;

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><div className="kicker">FALSE IDOLS HQ</div><h1>DASHBOARD</h1></div>
      <div className="stat-grid">
        {stats.map(([l, n]) => <div className="stat" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>)}
      </div>

      <h2><span className="bar">/</span> {isAdmin ? 'NEEDS ATTENTION' : 'YOUR SUBMISSIONS AWAITING APPROVAL'}</h2>
      {pendingEvents.length ? (
        <div className="table-wrap"><table className="list"><tbody>
          <tr><th>Event</th><th>Date</th><th></th></tr>
          {pendingEvents.map((e) => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td>{fmtDate(e.start_at)}</td>
              <td><Link className="btn btn-sm" href={`/admin/events/${e.id}/edit`}>{isAdmin ? 'REVIEW' : 'VIEW'}</Link></td>
            </tr>
          ))}
        </tbody></table></div>
      ) : <p className="muted">{isAdmin ? 'No event submissions waiting.' : 'Nothing awaiting approval right now.'}</p>}
      {isAdmin && pendingMedia > 0 && (
        <p style={{ marginTop: 14 }}><Link className="btn btn-ghost" href="/admin/media?status=pending">REVIEW {pendingMedia} PENDING MEDIA →</Link></p>
      )}

      <div className="cta-row" style={{ marginTop: 30 }}>
        <Link className="btn" href="/admin/events/new">{isAdmin ? '+ CREATE EVENT' : '+ SUBMIT EVENT'}</Link>
        <Link className="btn btn-ghost" href="/admin/events">{isAdmin ? 'MANAGE EVENTS' : 'MY EVENTS'}</Link>
        {isAdmin && <Link className="btn btn-ghost" href="/admin/media">MEDIA VAULT</Link>}
        {isAdmin && <Link className="btn btn-ghost" href="/admin/users">MANAGE USERS</Link>}
      </div>
    </>
  );
}
