import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../lib/db';
import { fmtDate, fmtTime, nowIso } from '../../../lib/util';

export const dynamic = 'force-dynamic';

async function getEvent(slug) {
  const sql = await db();
  const rows = await sql`SELECT * FROM events WHERE slug = ${slug} AND status IN ('published','cancelled','archived')`;
  return rows[0] || null;
}

export async function generateMetadata({ params }) {
  const e = await getEvent(params.slug);
  if (!e) return { title: 'Event Not Found' };
  return {
    title: e.name,
    description: `${e.name} — ${fmtDate(e.start_at)} — False Idols`,
    openGraph: { title: e.name, type: 'website', images: e.flyer_url ? [e.flyer_url] : undefined },
  };
}

export default async function EventDetail({ params }) {
  const e = await getEvent(params.slug);
  if (!e) notFound();

  const sql = await db();
  const media = await sql`SELECT * FROM media WHERE event_id = ${e.id} AND status IN ('approved','featured')
    ORDER BY (status = 'featured') DESC, created_at DESC LIMIT 60`;
  const isPast = (e.end_at || e.start_at) < nowIso().slice(0, 10);

  const facts = [
    ['DATE', fmtDate(e.start_at) + (e.end_at && e.end_at.slice(0, 10) !== e.start_at.slice(0, 10) ? ` – ${fmtDate(e.end_at)}` : '')],
    ['TIME', [fmtTime(e.start_at), fmtTime(e.end_at)].filter(Boolean).join(' – ')],
    ['VENUE', e.venue],
    ['LOCATION', [e.address, e.city, e.state].filter(Boolean).join(', ')],
    ['TYPE', e.category],
  ].filter(([, v]) => v);

  const gcalDate = (iso) => (iso ? iso.replace(/[-:]/g, '') + '00' : '');
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.name)}&dates=${gcalDate(e.start_at)}/${gcalDate(e.end_at || e.start_at)}&location=${encodeURIComponent([e.venue, e.city, e.state].filter(Boolean).join(', '))}`;

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Event', name: e.name,
    startDate: e.start_at, endDate: e.end_at || undefined,
    eventStatus: e.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    location: { '@type': 'Place', name: e.venue || [e.city, e.state].filter(Boolean).join(', '), address: [e.address, e.city, e.state].filter(Boolean).join(', ') },
    image: e.flyer_url ? [e.flyer_url] : undefined,
    description: (e.description || '').slice(0, 300),
    organizer: { '@type': 'Organization', name: 'False Idols Freestyle Athletics', url: 'https://www.falseidols.us' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <div className="hero" style={{ paddingBottom: 0 }}>
        <div className="kicker">
          {e.status === 'cancelled' ? <span className="badge-cancelled">CANCELLED</span> : isPast ? 'PAST EVENT' : 'UPCOMING EVENT'}
          {' · '}{e.category.toUpperCase()}
        </div>
        <h1>{e.name}</h1>
        <p className="sub">
          {fmtDate(e.start_at)}{fmtTime(e.start_at) ? ` · ${fmtTime(e.start_at)}` : ''}
          {e.city ? ` · ${[e.city, e.state].filter(Boolean).join(', ')}` : ''}
        </p>
      </div>

      <div className="event-hero">
        <div>{e.flyer_url && <div className="flyer"><img src={e.flyer_url} alt={`${e.name} flyer`} /></div>}</div>
        <div>
          <ul className="event-facts">
            {facts.map(([k, v]) => <li key={k}><span className="k">{k}</span><span>{v}</span></li>)}
          </ul>
          <div className="cta-row">
            {e.ticket_url && <a className="btn" href={e.ticket_url} target="_blank" rel="noopener">GET TICKETS / RSVP</a>}
            {e.status !== 'cancelled' && !isPast && <a className="btn btn-ghost" href={gcal} target="_blank" rel="noopener">ADD TO CALENDAR</a>}
            {e.ig_url && <a className="btn btn-ghost" href={e.ig_url} target="_blank" rel="noopener">INSTAGRAM</a>}
          </div>
          {e.description && <p className="desc">{e.description}</p>}
        </div>
      </div>

      {media.length > 0 && (
        <>
          <h2 id="media"><span className="bar">/</span> MEDIA FROM THIS EVENT <span className="muted" style={{ fontSize: 14 }}>({media.length})</span></h2>
          <div className="gallery">
            {media.map((m) => (
              <div className="g-item" key={m.id}>
                {m.status === 'featured' && <span className="g-feat">FEATURED</span>}
                {m.kind === 'video'
                  ? <video src={m.blob_url} controls preload="metadata" />
                  : <a href={m.blob_url} target="_blank" rel="noopener"><img src={m.blob_url} alt="" loading="lazy" /></a>}
                {m.uploader_ig && <div className="g-credit">📸 {m.uploader_ig.startsWith('@') ? m.uploader_ig : `@${m.uploader_ig}`}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {!!e.public_uploads && (
        <div className="upload-cta">
          <h2>SHOT SOMETHING{isPast ? ' AT THIS EVENT' : ' SICK'}?</h2>
          <p className="muted">Drop your photos &amp; videos from this event straight into the False Idols vault.</p>
          <p style={{ marginTop: 14 }}><Link className="btn" href={`/e/${e.slug}/upload`}>UPLOAD YOUR FOOTAGE</Link></p>
        </div>
      )}
    </>
  );
}
