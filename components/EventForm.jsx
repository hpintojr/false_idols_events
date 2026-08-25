'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';

const CATEGORIES = ['Moto','BMX','Skate','Auto','Stunt','Freestyle','Giveaway','Music','Lifestyle','Brand Appearance','Competition','Shoot','Meet-Up','Party','Community','Other'];

export default function EventForm({ event, role, userId }) {
  const e = event || {};
  const isNew = !event;
  const isAdmin = role === 'admin';
  const isOwner = isNew || e.submitted_by === userId;
  const router = useRouter();
  const formRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const date = (iso) => (iso ? iso.slice(0, 10) : '');
  const time = (iso) => (iso && iso.length >= 16 ? iso.slice(11, 16) : '');

  async function submit(ev, setStatus) {
    ev.preventDefault();
    setError('');
    const form = formRef.current;
    setBusy(true);
    try {
      let flyerUrl = '';
      const flyerFile = form.flyer.files && form.flyer.files[0];
      if (flyerFile) {
        const blob = await upload(`flyers/${flyerFile.name}`, flyerFile, {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
          clientPayload: JSON.stringify({ kind: 'flyer' }),
        });
        flyerUrl = blob.url;
      }
      const payload = {
        name: form.name.value,
        start_date: form.start_date.value,
        start_time: form.start_time.value,
        end_date: form.end_date.value,
        end_time: form.end_time.value,
        category: form.category.value,
        venue: form.venue.value,
        address: form.address.value,
        city: form.city.value,
        state: form.state.value,
        description: form.description.value,
        ticket_url: form.ticket_url.value,
        ig_url: form.ig_url.value,
        notes: form.notes.value,
        featured: form.featured ? form.featured.checked : false,
        public_uploads: form.public_uploads.checked,
        flyer_url: flyerUrl,
        set_status: setStatus || '',
      };
      const res = await fetch(isNew ? '/api/events' : `/api/events/${e.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');
      router.push('/admin/events');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Save failed');
      setBusy(false);
    }
  }

  return (
    <form className="stack" ref={formRef} onSubmit={submit} style={{ marginTop: 18 }}>
      {error && <div className="error-box">{error}</div>}
      <div className="field"><label>EVENT NAME *</label><input type="text" name="name" required maxLength={120} defaultValue={e.name || ''} /></div>
      <div className="field-row">
        <div className="field"><label>START DATE *</label><input type="date" name="start_date" required defaultValue={date(e.start_at)} /></div>
        <div className="field"><label>START TIME</label><input type="time" name="start_time" defaultValue={time(e.start_at)} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>END DATE</label><input type="date" name="end_date" defaultValue={date(e.end_at)} /></div>
        <div className="field"><label>END TIME</label><input type="time" name="end_time" defaultValue={time(e.end_at)} /></div>
      </div>
      <div className="field"><label>EVENT TYPE</label>
        <select name="category" defaultValue={e.category || 'Moto'}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="field"><label>VENUE NAME</label><input type="text" name="venue" maxLength={120} defaultValue={e.venue || ''} /></div>
      <div className="field"><label>STREET ADDRESS</label><input type="text" name="address" maxLength={160} defaultValue={e.address || ''} /></div>
      <div className="field-row">
        <div className="field"><label>CITY</label><input type="text" name="city" maxLength={80} defaultValue={e.city || ''} /></div>
        <div className="field"><label>STATE</label><input type="text" name="state" maxLength={40} defaultValue={e.state || ''} /></div>
      </div>
      <div className="field"><label>DESCRIPTION</label><textarea name="description" maxLength={5000} defaultValue={e.description || ''} /></div>
      <div className="field"><label>FLYER {e.flyer_url ? '(replace current)' : ''}</label>
        {e.flyer_url && <p style={{ marginBottom: 8 }}><img src={e.flyer_url} alt="" style={{ maxWidth: 180, borderRadius: 4 }} /></p>}
        <input type="file" name="flyer" accept="image/*" />
      </div>
      <div className="field"><label>TICKET / RSVP LINK</label><input type="url" name="ticket_url" maxLength={300} defaultValue={e.ticket_url || ''} placeholder="https://" /></div>
      <div className="field"><label>INSTAGRAM LINK</label><input type="url" name="ig_url" maxLength={300} defaultValue={e.ig_url || ''} placeholder="https://instagram.com/..." /></div>
      <div className="field"><label>INTERNAL NOTES (never public)</label><textarea name="notes" maxLength={2000} style={{ minHeight: 70 }} defaultValue={e.notes || ''} /></div>
      {isAdmin && <label className="check"><input type="checkbox" name="featured" defaultChecked={!!e.featured} /><span>Feature this event (hero placement on the Events page)</span></label>}
      <label className="check"><input type="checkbox" name="public_uploads" defaultChecked={isNew || !!e.public_uploads} /><span>Allow public media uploads (Media Drop + QR)</span></label>

      {!isNew && (
        <div className="field">
          <label>STATUS — <span className={`status-pill st-${e.status}`}>{e.status}</span></label>
          <div className="cta-row" style={{ marginTop: 6 }}>
            {isAdmin && e.status !== 'published' && <button type="button" className="btn btn-ok btn-sm" disabled={busy} onClick={(ev) => submit(ev, 'published')}>PUBLISH</button>}
            {isAdmin && e.status === 'published' && <button type="button" className="btn btn-warn btn-sm" disabled={busy} onClick={(ev) => { if (confirm('Cancel this event?')) submit(ev, 'cancelled'); }}>CANCEL EVENT</button>}
            {isAdmin && e.status !== 'archived' && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={(ev) => submit(ev, 'archived')}>ARCHIVE</button>}
            {isAdmin && (e.status === 'cancelled' || e.status === 'archived') && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={(ev) => submit(ev, 'draft')}>BACK TO DRAFT</button>}
            {!isAdmin && isOwner && e.status === 'draft' && <button type="button" className="btn btn-sm" disabled={busy} onClick={(ev) => submit(ev, 'submitted')}>SUBMIT FOR APPROVAL</button>}
            {!isAdmin && isOwner && (e.status === 'submitted' || e.status === 'published') && (
              <button type="button" className="btn btn-warn btn-sm" disabled={busy} onClick={(ev) => { if (confirm("Cancel this event? You won't be able to undo this yourself — only an admin can reinstate it.")) submit(ev, 'cancelled'); }}>CANCEL EVENT</button>
            )}
          </div>
          {!isAdmin && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>New submissions are reviewed by an admin before publishing. You can cancel your own event, but you can't delete it.</p>}
        </div>
      )}

      <div className="cta-row">
        <button className="btn" type="submit" disabled={busy}>{busy ? 'SAVING…' : isNew ? 'CREATE EVENT' : 'SAVE CHANGES'}</button>
        <a className="btn btn-ghost" href="/admin/events">BACK</a>
        {!isNew && e.status === 'published' && <a className="btn btn-ghost" href={`/e/${e.slug}/upload`} target="_blank">UPLOAD PAGE (QR TARGET)</a>}
      </div>
    </form>
  );
}
