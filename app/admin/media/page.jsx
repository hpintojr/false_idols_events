import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '../../../lib/db';
import { currentUser } from '../../../lib/auth';
import { MEDIA_STATUSES } from '../../../lib/util';
import { StatusPill } from '../../../components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media Vault' };

function ActionButton({ m, status, label, cls, back }) {
  if (m.status === status) return null;
  return (
    <form className="inline" method="post" action="/api/media/status">
      <input type="hidden" name="id" value={m.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="back" value={back} />
      <button className={`btn ${cls} btn-sm`}>{label}</button>
    </form>
  );
}

export default async function MediaPage({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  const f = MEDIA_STATUSES.includes(searchParams?.status) ? searchParams.status : 'pending';
  const back = `/admin/media?status=${f}`;
  const sql = await db();
  const rows = await sql`SELECT m.*, e.name AS event_name FROM media m JOIN events e ON e.id = m.event_id
    WHERE m.status = ${f} ORDER BY m.created_at DESC LIMIT 200`;
  const counts = {};
  for (const r of await sql`SELECT status, COUNT(*)::int n FROM media GROUP BY status`) counts[r.status] = r.n;

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}>
        <h1>MEDIA VAULT</h1>
        <p className="sub muted">Review public and team uploads. Approved media appears in the event gallery; featured media is pinned first.</p>
      </div>
      <div className="filter-row">
        {MEDIA_STATUSES.map((s) => (
          <Link key={s} href={`/admin/media?status=${s}`} className={f === s ? 'active' : ''}>
            {s.toUpperCase()} ({counts[s] || 0})
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>Nothing with status “{f}”.</p>
      ) : (
        <div className="mod-grid">
          {rows.map((m) => (
            <div className="mod-card" key={m.id}>
              <div className="m-media">
                {m.kind === 'video'
                  ? <video src={m.blob_url} controls preload="metadata" />
                  : <img src={m.blob_url} alt="" loading="lazy" />}
              </div>
              <div className="m-body">
                <strong>{m.event_name}</strong><br />
                {m.uploader_name}{m.uploader_ig ? ` · ${m.uploader_ig}` : ''}<br />
                {m.athletes && <>Athletes: {m.athletes}<br /></>}
                {m.caption && <>“{m.caption}”<br /></>}
                <span className="muted">{m.original_name} · {(Number(m.size) / 1024 / 1024).toFixed(1)}MB · <StatusPill status={m.status} /></span>
              </div>
              <div className="m-actions">
                <ActionButton m={m} status="approved" label="APPROVE" cls="btn-ok" back={back} />
                <ActionButton m={m} status="featured" label="FEATURE" cls="" back={back} />
                <ActionButton m={m} status="rejected" label="REJECT" cls="btn-warn" back={back} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
