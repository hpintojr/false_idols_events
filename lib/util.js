export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD')
    .replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
    .slice(0, 80) || 'event';
}

/** Parse "YYYY-MM-DDTHH:MM" local wall time into parts (no timezone math). */
export function parts(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] !== undefined ? +m[4] : null, mi: m[5] !== undefined ? +m[5] : null };
}

export function fmtDate(iso) {
  const p = parts(iso);
  if (!p) return '';
  return `${MONTHS[p.mo - 1]} ${p.d}, ${p.y}`;
}

export function fmtTime(iso) {
  const p = parts(iso);
  if (!p || p.h === null) return '';
  const ampm = p.h >= 12 ? 'PM' : 'AM';
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${String(p.mi).padStart(2, '0')} ${ampm}`;
}

/** "now" in the site's home timezone as a comparable local ISO minute string. */
export function nowIso() {
  const tz = process.env.FI_TIMEZONE || 'America/Los_Angeles';
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const CATEGORIES = ['Moto','BMX','Skate','Auto','Stunt','Freestyle','Music','Lifestyle','Brand Appearance','Competition','Shoot','Meet-Up','Party','Community','Other'];
export const EVENT_STATUSES = ['draft','submitted','published','cancelled','archived'];
export const MEDIA_STATUSES = ['pending','approved','featured','rejected'];
export const USER_ROLES = ['admin','user','suspended'];

export const RELEASE_VERSION = 'v1-2026-08';
export const RELEASE_TEXT = `By submitting content you confirm that you created the submitted photos/videos or have the right to share them, and you grant False Idols Freestyle Athletics a worldwide, royalty-free license to use, edit, reproduce, and publish the content on its website, social media, and marketing channels, with credit where practical. You confirm any recognizable people consented to being filmed at a public event. You may request removal by contacting False Idols. (Final legal language to be reviewed by counsel.)`;

export const IMAGE_MIME = ['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif'];
export const VIDEO_MIME = ['video/mp4','video/quicktime','video/x-m4v','video/webm'];

/** crude in-memory rate limiter (per serverless instance — best-effort) */
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > windowMs) { b = { start: now, count: 0 }; buckets.set(key, b); }
  b.count++;
  if (buckets.size > 5000) buckets.clear();
  return b.count <= max;
}
