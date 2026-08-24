import { notFound } from 'next/navigation';
import { db } from '../../../../lib/db';
import { fmtDate, RELEASE_TEXT } from '../../../../lib/util';
import UploadForm from '../../../../components/UploadForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Upload Your Footage' };

export default async function UploadPage({ params }) {
  const sql = await db();
  const rows = await sql`SELECT * FROM events WHERE slug = ${params.slug} AND status IN ('published','cancelled','archived')`;
  const e = rows[0];
  if (!e || !e.public_uploads) notFound();

  return (
    <>
      <div className="hero" style={{ paddingBottom: 8 }}>
        <div className="kicker">MEDIA DROP</div>
        <h1>UPLOAD YOUR FOOTAGE</h1>
        <p className="sub">
          <strong>{e.name}</strong> · {fmtDate(e.start_at)}{e.city ? ` · ${e.city}` : ''}<br />
          Photos and videos go to the False Idols content team for review. Approved shots can be featured on the event page and socials — with credit.
        </p>
      </div>
      <UploadForm slug={e.slug} releaseText={RELEASE_TEXT} />
    </>
  );
}
