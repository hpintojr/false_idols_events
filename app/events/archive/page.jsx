import { db } from '../../../lib/db';
import { nowIso, parts, MONTHS } from '../../../lib/util';
import { EventCard } from '../../../components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Past Events' };

export default async function ArchivePage() {
  const sql = await db();
  const today = nowIso().slice(0, 10);
  const past = await sql`SELECT * FROM events WHERE status IN ('published','archived','cancelled') AND COALESCE(end_at, start_at) < ${today} ORDER BY start_at DESC`;

  // Group by year → month
  const years = [];
  for (const e of past) {
    const p = parts(e.start_at);
    let yr = years.find((x) => x.y === p.y);
    if (!yr) { yr = { y: p.y, months: [] }; years.push(yr); }
    let mo = yr.months.find((x) => x.m === p.mo);
    if (!mo) { mo = { m: p.mo, events: [] }; yr.months.push(mo); }
    mo.events.push(e);
  }

  return (
    <>
      <div className="hero">
        <div className="kicker">THE HISTORY</div>
        <h1>PAST EVENTS</h1>
        <p className="sub">Every event lives on. Browse back through everything False Idols has done.</p>
      </div>
      {past.length === 0 && <p className="muted">No past events yet — history starts now.</p>}
      {years.map((yr) => (
        <div className="archive-year" key={yr.y}>
          <h2>{yr.y}</h2>
          {yr.months.map((mo) => (
            <div className="archive-month" key={mo.m}>
              <h3>{MONTHS[mo.m - 1].toUpperCase()}</h3>
              <div className="event-grid">{mo.events.map((e) => <EventCard key={e.id} e={e} />)}</div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
