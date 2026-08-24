# FALSE IDOLS — Events, Calendar & Media Platform (Vercel edition)

Next.js 14 + Neon Postgres + Vercel Blob. Same platform as the Node edition, built for the Vercel/GitHub/Neon stack.

**Public:** `/events` (featured hero + this month + later + recent past) · `/calendar` (month grid) · `/events/{slug}` (flyer, details, tickets, add-to-calendar, approved gallery with credit, JSON-LD SEO) · `/events/archive` (year/month history) · `/e/{slug}/upload` (Media Drop — QR target; batch photo/video direct-to-Blob uploads with progress + content release)

**Team (`/admin`):** dashboard, event create/edit with flyer upload, feature + public-uploads toggles, admin publish/cancel/archive, staff submissions requiring admin approval, media vault (pending → approve / feature / reject), audit log.

**Storage layout (per the platform handoff):** Neon holds structured data + media metadata; Vercel Blob holds the actual files; uploads go browser → Blob directly (no serverless size limits); DB schema auto-creates on first request; first admin auto-creates from env vars.

## Deploy (one time, ~15 minutes)

1. **GitHub**: push this folder to a new private repo.
2. **Vercel**: New Project → import the repo. Framework auto-detects Next.js.
3. **Neon**: in the Vercel project → Storage tab → add **Neon (Postgres)** → this injects `DATABASE_URL` automatically.
4. **Blob**: same Storage tab → add **Blob** → injects `BLOB_READ_WRITE_TOKEN`.
5. **Env vars** (Project → Settings → Environment Variables):
   - `FI_ADMIN_EMAIL` — your login email
   - `FI_ADMIN_PASSWORD` — a strong password (creates the first admin on first request)
   - `FI_ADMIN_NAME` — e.g. `Hamilton`
   - `FI_SECRET` — any long random string (session signing)
   - `FI_TIMEZONE` — optional, default `America/Los_Angeles`
6. **Deploy** → visit `/admin/login`, log in, create real events.
7. **Domain**: Project → Settings → Domains → add `events.falseidols.us`; then in the falseidols.us DNS add the CNAME Vercel shows. The Shopify store at `www.falseidols.us` is untouched — the site's SHOP link already points there.

QR codes for signage → point any QR generator at `https://events.falseidols.us/e/{event-slug}/upload` (the admin edit page links the exact URL per event).

## Notes

- Media files get unguessable public Blob URLs; the site only shows approved/featured items. True private storage can be added later if needed.
- Content-release text in `lib/util.js` is a placeholder — have the client's attorney review before launch.
- GHL wiring (when the sub-account exists): on event publish → create GHL calendar event (store in `events.ghl_calendar_event_id`); on media upload → upsert GHL contact from uploader name/email/IG (tag `media-drop`) — the lead-capture loop; webhooks → team notifications.
- Adding team users: for now insert into the `users` table via Neon's SQL console (scrypt `salt:hash` — ask Claude to generate one), or we add a user-management page next.
