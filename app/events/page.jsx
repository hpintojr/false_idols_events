import Link from 'next/link';
import { db } from '../../lib/db';
import { nowIso, fmtDate, fmtTime } from '../../lib/util';
import { EventCard } from '../../components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events' };

function Section({ title, list }) {
  if (!list.length) return null;
  return (
    <>
      <h2><span className="bar">/</span> {title}</h2>
      <div className="event-grid">{list.map((e) => <EventCard key={e.id} e={e} />)}</div>
    </>
  );
}

export default async function EventsPage() {
  const sql = await db();
  const all = await sql`SELECT * FROM events WHERE status IN ('published','cancelled') ORDER BY start_at ASC`;
  const now = nowIso();
  const today = now.slice(0, 10);
  const month = now.slice(0, 7);

  const upcoming = all.filter((e) => (e.end_at || e.start_at) >= today);
  const featured = upcoming.find((e) => e.featured && e.status === 'published');
  const thisMonth = upcoming.filter((e) => e.start_at.slice(0, 7) === month && e !== featured);
  const later = upcoming.filter((e) => e.start_at.slice(0, 7) > month && e !== featured);
  const recentPast = all.filter((e) => (e.end_at || e.start_at) < today).slice(-4).reverse();

  return (
    <>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, fontSize: 11, overflow: 'auto' }}>
        {JSON.stringify({ allLen: all.length, upcomingLen: upcoming.length, today, month, hasFeatured: !!featured, thisMonthLen: thisMonth.length, laterLen: later.length }, null, 2)}
      </pre>
      <div className="hero">
        <div className="kicker">FALSE IDOLS FREESTYLE ATHLETICS</div>
        <h1>EVENTS</h1>
        <p className="sub">Where the team rides, shoots, and shows up next. Pull up, shoot content, and drop your footage right here.</p>
      </div>

      {featured && (
        <Link className="featured-card" href={`/events/${featured.slug}`}>
          {featured.flyer_url && <div className="fc-img"><img src={featured.flyer_url} alt="" /></div>}
          <div className="fc-body">
            <div className="fc-kicker">FEATURED EVENT</div>
            <div className="fc-name">{featured.name}</div>
            <div className="fc-meta">
              {fmtDate(featured.start_at)}{fmtTime(featured.start_at) ? ` · ${fmtTime(featured.start_at)}` : ''}<br />
              {[featured.venue, featured.city, featured.state].filter(Boolean).join(' · ')}
            </div>
            <p style={{ marginTop: 16 }}><span className="btn">VIEW EVENT</span></p>
          </div>
        </Link>
      )}

      <Section title="THIS MONTH" list={thisMonth} />
      <Section title={featured || thisMonth.length ? 'LATER' : 'UPCOMING'} list={later} />
      {upcoming.length === 0 && <p className="muted" style={{ marginTop: 30 }}>No upcoming events posted yet. Check back soon.</p>}
      <Section title="RECENT PAST EVENTS" list={recentPast} />

      <p style={{ marginTop: 26 }}><Link className="btn btn-ghost" href="/events/archive">FULL EVENT ARCHIVE →</Link></p>
    </>
  );
}
