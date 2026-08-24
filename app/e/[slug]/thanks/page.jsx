import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Footage Received' };

export default async function ThanksPage({ params, searchParams }) {
  const sql = await db();
  const rows = await sql`SELECT name, slug FROM events WHERE slug = ${params.slug}`;
  const e = rows[0];
  if (!e) notFound();
  const n = parseInt(searchParams?.n, 10) || 0;

  return (
    <div className="hero" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div className="kicker">MEDIA DROP</div>
      <h1>FOOTAGE RECEIVED 🤘</h1>
      <p className="sub" style={{ margin: '14px auto 0' }}>
        {n ? `${n} file${n === 1 ? '' : 's'} uploaded for` : 'Your upload for'} <strong>{e.name}</strong> {n === 1 ? 'is' : 'are'} in the vault.
        The False Idols content team reviews everything — approved shots hit the event page and socials with credit.
      </p>
      <div className="cta-row" style={{ justifyContent: 'center', marginTop: 26 }}>
        <Link className="btn" href={`/e/${e.slug}/upload`}>UPLOAD MORE</Link>
        <Link className="btn btn-ghost" href={`/events/${e.slug}`}>BACK TO EVENT</Link>
      </div>
    </div>
  );
}
