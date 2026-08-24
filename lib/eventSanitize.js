import { CATEGORIES } from './util';

export function sanitizeEvent(body) {
  const safeUrl = (u) => { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u.slice(0, 300) : ''; };
  const name = String(body.name || '').trim().slice(0, 120);
  const startDate = String(body.start_date || '').trim();
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: 'Event name and a valid start date are required.' };

  const startAt = startDate + (/^\d{2}:\d{2}$/.test(body.start_time || '') ? `T${body.start_time}` : 'T00:00');
  let endAt = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(body.end_date || '')) {
    endAt = body.end_date + (/^\d{2}:\d{2}$/.test(body.end_time || '') ? `T${body.end_time}` : 'T23:59');
  } else if (/^\d{2}:\d{2}$/.test(body.end_time || '')) {
    endAt = `${startDate}T${body.end_time}`;
  }

  let flyerUrl = null;
  if (typeof body.flyer_url === 'string' && /^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\//.test(body.flyer_url)) {
    flyerUrl = body.flyer_url.slice(0, 500);
  }

  return {
    name, start_at: startAt, end_at: endAt,
    description: String(body.description || '').slice(0, 5000),
    category: CATEGORIES.includes(body.category) ? body.category : 'Other',
    venue: String(body.venue || '').slice(0, 120),
    address: String(body.address || '').slice(0, 160),
    city: String(body.city || '').slice(0, 80),
    state: String(body.state || '').slice(0, 40),
    ticket_url: safeUrl(body.ticket_url),
    ig_url: safeUrl(body.ig_url),
    notes: String(body.notes || '').slice(0, 2000),
    featured: body.featured ? 1 : 0,
    public_uploads: body.public_uploads ? 1 : 0,
    flyer_url: flyerUrl,
    flyer_provided: typeof body.flyer_url === 'string' && body.flyer_url !== '',
  };
}
