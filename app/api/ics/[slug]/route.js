import { db } from '../../../../lib/db';
import { parts } from '../../../../lib/util';

export const dynamic = 'force-dynamic';

function getTzOffsetMs(utcMillis, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = dtf.formatToParts(new Date(utcMillis)).reduce((a, x) => {
    if (x.type !== 'literal') a[x.type] = x.value;
    return a;
  }, {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === '24' ? 0 : +p.hour, +p.minute, +p.second);
  return asUTC - utcMillis;
}

function zonedPartsToUtcDate(p, timeZone) {
  const utcGuess = Date.UTC(p.y, p.mo - 1, p.d, p.h || 0, p.mi || 0);
  const offset = getTzOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess - offset);
}

function icsUtcStamp(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function icsEscape(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\,').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldLine(line) {
  if (line.length <= 75) return line;
  let out = '', first = true, rest = line;
  while (rest.length) {
    const n = first ? 75 : 74;
    out += (first ? '' : '\r\n ') + rest.slice(0, n);
    rest = rest.slice(n);
    first = false;
  }
  return out;
}

export async function GET(request, { params }) {
  const sql = await db();
  const rows = await sql`SELECT * FROM events WHERE slug = ${params.slug} AND status IN ('published','cancelled','archived')`;
  const e = rows[0];
  if (!e) return new Response('Not found', { status: 404 });

  const tz = e.timezone || 'America/Los_Angeles';
  const sp = parts(e.start_at);
  if (!sp) return new Response('Invalid event date', { status: 500 });
  const startUtc = zonedPartsToUtcDate(sp, tz);

  let endUtc;
  if (e.end_at) {
    const ep = parts(e.end_at);
    endUtc = ep ? zonedPartsToUtcDate(ep, tz) : new Date(startUtc.getTime() + 2 * 60 * 60 * 1000);
  } else if (sp.h !== null) {
    endUtc = new Date(startUtc.getTime() + 2 * 60 * 60 * 1000);
  } else {
    endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  }

  const location = [e.venue, e.address, e.city, e.state].filter(Boolean).join(', ');
  const url = `https://false-idols-events.vercel.app/events/${e.slug}`;
  const uid = `${e.id}@falseidols.us`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//False Idols Freestyle Athletics//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsUtcStamp(new Date())}`,
    `DTSTART:${icsUtcStamp(startUtc)}`,
    `DTEND:${icsUtcStamp(endUtc)}`,
    `SUMMARY:${icsEscape(e.name)}`,
    location ? `LOCATION:${icsEscape(location)}` : null,
    e.description ? `DESCRIPTION:${icsEscape(e.description)}` : null,
    `URL:${url}`,
    e.status === 'cancelled' ? 'STATUS:CANCELLED' : 'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).map(foldLine);

  const body = lines.join('\r\n') + '\r\n';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${e.slug}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
