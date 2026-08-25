'use client';
import { useState } from 'react';

export default function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    setOk(false);
    const form = ev.target;
    const current_password = form.current_password.value;
    const new_password = form.new_password.value;
    const confirm_password = form.confirm_password.value;
    if (new_password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (new_password !== confirm_password) { setError('New passwords do not match.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password, new_password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not change password');
      setOk(true);
      form.reset();
    } catch (err) {
      setError(err.message || 'Could not change password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} style={{ marginTop: 14, maxWidth: 420 }}>
      {error && <div className="error-box">{error}</div>}
      {ok && <div className="flash">Password updated.</div>}
      <div className="field"><label>CURRENT PASSWORD</label><input type="password" name="current_password" required autoComplete="current-password" /></div>
      <div className="field"><label>NEW PASSWORD</label><input type="password" name="new_password" required minLength={8} autoComplete="new-password" /></div>
      <div className="field"><label>CONFIRM NEW PASSWORD</label><input type="password" name="confirm_password" required minLength={8} autoComplete="new-password" /></div>
      <div className="cta-row"><button className="btn" type="submit" disabled={busy}>{busy ? 'SAVING…' : 'CHANGE PASSWORD'}</button></div>
    </form>
  );
}
