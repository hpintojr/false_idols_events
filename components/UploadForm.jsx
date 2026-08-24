'use client';
import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

const MAX_FILES = 60;
const MAX_BYTES = 1024 * 1024 * 1024; // 1GB per file

export default function UploadForm({ slug, releaseText }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [pct, setPct] = useState(0);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  async function onSubmit(ev) {
    ev.preventDefault();
    setError('');
    const form = formRef.current;
    const files = Array.from(form.files.files || []);
    if (!files.length) return setError('Please attach at least one photo or video.');
    if (files.length > MAX_FILES) return setError(`Max ${MAX_FILES} files per submission — split it into batches.`);
    for (const f of files) {
      if (f.size > MAX_BYTES) return setError(`"${f.name}" is over the 1GB per-file limit.`);
      if (!/^(image|video)\//.test(f.type) && !/\.(heic|heif|mov|mp4|m4v|webm|jpe?g|png|gif|webp)$/i.test(f.name)) {
        return setError(`File type not allowed: ${f.name}`);
      }
    }
    if (!form.release.checked) return setError('Please accept the content release.');

    setBusy(true);
    const uploaded = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}: ${f.name}`);
        setPct(Math.round((i / files.length) * 100));
        const blob = await upload(`media/${slug}/${f.name}`, f, {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
          clientPayload: JSON.stringify({ kind: 'media', slug }),
        });
        uploaded.push({ url: blob.url, name: f.name, size: f.size, type: f.type || '' });
      }
      setPct(100);
      setProgress('Saving your submission…');

      const res = await fetch('/api/media/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: form.name.value,
          email: form.email.value,
          ig: form.ig.value,
          caption: form.caption.value,
          athletes: form.athletes.value,
          files: uploaded,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submission failed');
      window.location.href = `/e/${slug}/thanks?n=${uploaded.length}`;
    } catch (err) {
      setError(err.message || 'Upload failed — try again.');
      setBusy(false);
      setProgress('');
      setPct(0);
    }
  }

  return (
    <form className="stack" ref={formRef} onSubmit={onSubmit} style={{ marginTop: 20 }}>
      {error && <div className="error-box">{error}</div>}
      <div className="field">
        <label htmlFor="f">PHOTOS / VIDEOS *</label>
        <input id="f" type="file" name="files" multiple required accept="image/*,video/*" disabled={busy} />
        <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>JPG, PNG, HEIC, WebP, GIF, MP4, MOV, WebM · up to 1GB per file · select as many as you want</p>
      </div>
      <div className="field-row">
        <div className="field"><label htmlFor="n">NAME *</label><input id="n" type="text" name="name" required maxLength={80} disabled={busy} /></div>
        <div className="field"><label htmlFor="em">EMAIL *</label><input id="em" type="email" name="email" required maxLength={120} disabled={busy} /></div>
      </div>
      <div className="field"><label htmlFor="ig">INSTAGRAM HANDLE</label><input id="ig" type="text" name="ig" placeholder="@yourhandle" maxLength={60} disabled={busy} /></div>
      <div className="field"><label htmlFor="cap">WHAT DID YOU SHOOT?</label><input id="cap" type="text" name="caption" maxLength={200} placeholder="Wheelie line at sunset, crowd shots..." disabled={busy} /></div>
      <div className="field"><label htmlFor="ath">WHICH ATHLETES ARE FEATURED?</label><input id="ath" type="text" name="athletes" maxLength={200} placeholder="Names or IG handles" disabled={busy} /></div>
      <div className="field">
        <label>CONTENT RELEASE *</label>
        <div className="release-box">{releaseText}</div>
        <label className="check" style={{ marginTop: 10 }}>
          <input type="checkbox" name="release" value="yes" required disabled={busy} />
          <span>I agree to the content release above.</span>
        </label>
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'UPLOADING…' : 'SUBMIT FOOTAGE'}</button>
      {busy && (
        <>
          <div className="upbar" style={{ display: 'block' }}><div style={{ width: `${pct}%` }} /></div>
          <div id="uplist">{progress}</div>
        </>
      )}
    </form>
  );
}
