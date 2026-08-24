import Link from 'next/link';
import { db } from '../../lib/db';
import { MONTHS, MONTHS_SHORT, parts, fmtTime, nowIso } from '../../lib/util';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Calendar' };

export default async function CalendarPage({ searchParams }) {
  const now = nowIso();
  const np = parts(now);
  let y = parseInt(searchParams?.y, 10) || np.y;
  let m = parseInt(searchParams?.m, 10) || np.mo;
  if (m < 1 || m > 12 || y < 2000 || y > 2100) { y = np.y; m = np.mo; }

  const monthKey = `${y}-${String(m).padStart(2, '0')}`;
  const sql = await db();
  const events = await sql`SELECT * FROM events WHERE status IN ('published','cancelled') AND start_at LIKE ${monthKey + '%'} ORDER BY start_at`;
  const byDay = {};
  for (const e of events) { const d = parts(e.start_at).d; (byDay[d] = byDay[d] || []).push(e); }

  const startDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const isToday = (d) => y === np.y && m === np.mo && d === np.d;

  const weeks = [];
  let day = 1 - startDow;
  while (day <= daysInMonth) {
    const week = [];
    for (let dow = 0; dow < 7; dow++, day++) week.push(day >= 1 && day <= daysInMonth ? day : null);
    weeks.push(week);
  }

  const prevY = m === 1 ? y - 1 : y, prevM = m === 1 ? 12 : m - 1;
  const nextY = m === 12 ? y + 1 : y, nextM = m === 12 ? 1 : m + 1;

  return (
    <>
      <div className="hero"><div className="kicker">TEAM SCHEDULE</div><h1>CALENDAR</h1></div>
      <div className="cal-head">
        <div className="cal-title">{MONTHS[m - 1].toUpperCase()} {y}</div>
        <div className="cal-nav">
          <Link className="btn btn-ghost btn-sm" href={`/calendar?y=${prevY}&m=${prevM}`}>← {MONTHS_SHORT[prevM - 1]}</Link>
          <Link className="btn btn-ghost btn-sm" href="/calendar">TODAY</Link>
          <Link className="btn btn-ghost btn-sm" href={`/calendar?y=${nextY}&m=${nextM}`}>{MONTHS_SHORT[nextM - 1]} →</Link>
        </div>
      </div>
      <div className="cal-wrap">
        <table className="calendar">
          <thead><tr><th>SUN</th><th>MON</th><th>TUE</th><th>WED</th><th>THU</th><th>FRI</th><th>SAT</th></tr></thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((d, di) => d === null
                  ? <td key={di} className="out" />
                  : (
                    <td key={di} className={isToday(d) ? 'today' : undefined}>
                      <div className="cal-daynum">{d}</div>
                      {(byDay[d] || []).map((e) => (
                        <Link key={e.id} className={`cal-event${e.status === 'cancelled' ? ' cancelled' : ''}`} href={`/events/${e.slug}`} title={e.name}>
                          {fmtTime(e.start_at) ? fmtTime(e.start_at).replace(' ', '').toLowerCase() + ' ' : ''}{e.name}
                        </Link>
                      ))}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
