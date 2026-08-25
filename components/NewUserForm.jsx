'use client';
import { useState } from 'react';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function genPassword() {
  let out = '';
  for (let i = 0; i < 14; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export default function NewUserForm() {
  const [password, setPassword] = useState(genPassword());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    setBusy(true);
    const form = ev.target;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          password,
          role: form.role.value,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not create user');
      setCreated({ email: form.email.value, password });
    } catch (err) {
      setError(err.message || 'Could not create user');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="flash" style={{ marginTop: 18 }}>
        <p><strong>{created.email}</strong> was created.</p>
        <p style={{ fontFamily: 'monospace', fontSize: 18, marginTop: 8 }}>{created.password}</p>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Share this password with them securely — it won't be shown again. They can change it any time from their Account page.</p>
        <p style={{ marginTop: 14 }}><a className="btn btn-ghost btn-sm" href="/admin/users">BACK TO USERS</a></p>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} style={{ marginTop: 18, maxWidth: 420 }}>
      {error && <div className="error-box">{error}</div>}
      <div className="field"><label>NAME</label><input type="text" name="name" required maxLength={80} /></div>
      <div className="field"><label>EMAIL</label><input type="email" name="email" required /></div>
      <div className="field"><label>ROLE</label>
        <select name="role" defaultValue="user">
          <option value="admin">admin</option>
          <option value="user">user</option>
          <option value="suspended">suspended</option>
        </select>
      </div>
      <div className="field">
        <label>TEMPORARY PASSWORD</label>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} style={{ fontFamily: 'monospace' }} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPassword(genPassword())}>GENERATE</button>
        </div>
      </div>
      <div className="cta-row"><button className="btn" type="submit" disabled={busy}>{busy ? 'CREATING…' : 'CREATE USER'}</button></div>
    </form>
  );
}
