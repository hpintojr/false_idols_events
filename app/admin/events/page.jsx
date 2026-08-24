import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '../../../lib/db';
import { currentUser } from '../../../lib/auth';
import { fmtDate, fmtTime, EVENT_STATUSES } from '../../../lib/util';
import { StatusPill } from '../../../components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Events' };

export default async function AdminEvents({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  const f = EVENT_STATUSES.includes(searchParams?.status) ? searchParams.status : '';
  const sql = await db();
  const rows = f
    ? await sql`SELECT * FROM events WHERE status = ${f} ORDER BY start_at DESC`
    : await sql`SELECT * FROM events ORDER BY start_at DESC`;

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>EVENTS</h1></div>
      <div className="cta-row" style={{ marginTop: 14 }}><Link className="btn" href="/admin/events/new">+ CREATE EVENT</Link></div>
      <div className="filter-row">
        {['', ...EVENT_STATUSES].map((s) => (
          <Link key={s || 'all'} href={s ? `/admin/events?status=${s}` : '/admin/events'} className={f === s ? 'active' : ''}>
            {s ? s.toUpperCase() : 'ALL'}
          </Link>
        ))}
      </div>
      <div className="table-wrap"><table className="list"><tbody>
        <tr><th>Event</th><th>Date</th><th>City</th><th>Category</th><th>Status</th><th>★</th><th></th></tr>
        {rows.map((e) => (
          <tr key={e.id}>
            <td><strong>{e.name}</strong><br /><span className="muted">/{e.slug}</span></td>
            <td>{fmtDate(e.start_at)}<br /><span className="muted">{fmtTime(e.start_at)}</span></td>
            <td>{[e.city, e.state].filter(Boolean).join(', ')}</td>
            <td>{e.category}</td>
            <td><StatusPill status={e.status} /></td>
            <td>{e.featured ? '★' : ''}</td>
            <td style={{ whiteSpace: 'nowrap' }}>
              <Link className="btn btn-ghost btn-sm" href={`/admin/events/${e.id}/edit`}>EDIT</Link>{' '}
              {e.status === 'published' && <Link className="btn btn-ghost btn-sm" href={`/events/${e.slug}`} target="_blank">VIEW</Link>}
            </td>
          </tr>
        ))}
      </tbody></table></div>
      {rows.length === 0 && <p className="muted" style={{ marginTop: 16 }}>No events here yet.</p>}
    </>
  );
}
