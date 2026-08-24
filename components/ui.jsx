import Link from 'next/link';
import { MONTHS_SHORT, parts, fmtTime } from '../lib/util';

// Official False Idols logo served from the brand's own Shopify CDN.
// If the store ever moves, drop the PNG into /public and change this to '/logo-white.png'.
export const LOGO_URL = 'https://www.falseidols.us/cdn/shop/files/FALSE_IDOLS_PNG_WHITE.png?height=200&v=1764201219';

export function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="False Idols home">
      <img src={LOGO_URL} alt="False Idols Freestyle Athletics" className="logo-img" />
    </Link>
  );
}

/** Text-only fallback mark (used in the footer). */
export function TextMark() {
  return (
    <span className="wm-row"><span className="wm-false">FALSE</span><span className="wm-idols">IDOLS</span></span>
  );
}

export function EventCard({ e }) {
  const p = parts(e.start_at);
  return (
    <Link className="event-card" href={`/events/${e.slug}`}>
      <div className="thumb">
        {e.flyer_url
          ? <img src={e.flyer_url} alt={`${e.name} flyer`} loading="lazy" />
          : <div className="thumb-placeholder">FI</div>}
      </div>
      <div className="body">
        <div className="datebox">
          <div className="mon">{MONTHS_SHORT[p.mo - 1]}</div>
          <div className="day">{p.d}</div>
        </div>
        <div className="info">
          <div className="name">{e.name}</div>
          <div className="meta">
            {[e.city, e.state].filter(Boolean).join(', ') || 'Location TBA'}
            {fmtTime(e.start_at) ? ` · ${fmtTime(e.start_at)}` : ''}
          </div>
          <span className="chip cat">{e.category}</span>{' '}
          {e.status === 'cancelled' && <span className="badge-cancelled">CANCELLED</span>}
        </div>
      </div>
    </Link>
  );
}

export function StatusPill({ status }) {
  return <span className={`status-pill st-${status}`}>{status}</span>;
}
