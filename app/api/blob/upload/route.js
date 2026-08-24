import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { db } from '../../../../lib/db';
import { currentUser } from '../../../../lib/auth';
import { IMAGE_MIME, VIDEO_MIME, rateLimit } from '../../../../lib/util';

export async function POST(request) {
  const body = await request.json();
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || '{}'); } catch {}

        if (payload.kind === 'flyer') {
          // Flyer uploads: team members only
          const user = await currentUser();
          if (!user) throw new Error('Not authorized');
          return {
            allowedContentTypes: IMAGE_MIME,
            maximumSizeInBytes: 25 * 1024 * 1024,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ kind: 'flyer', uid: user.id }),
          };
        }

        // Public media drop: event must exist and allow uploads
        if (payload.kind !== 'media' || !payload.slug) throw new Error('Invalid upload request');
        if (!rateLimit('blob:' + ip, 200, 60 * 60 * 1000)) throw new Error('Too many uploads — try again later');
        const sql = await db();
        const rows = await sql`SELECT id FROM events WHERE slug = ${payload.slug} AND public_uploads = 1 AND status IN ('published','cancelled','archived')`;
        if (!rows[0]) throw new Error('Uploads are not open for this event');
        return {
          allowedContentTypes: [...IMAGE_MIME, ...VIDEO_MIME],
          maximumSizeInBytes: 1024 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: 'media', slug: payload.slug }),
        };
      },
      onUploadCompleted: async () => {
        // Media rows are recorded via /api/media/complete (carries uploader details).
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
