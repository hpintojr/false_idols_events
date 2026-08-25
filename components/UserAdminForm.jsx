'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = ['admin', 'user', 'suspended'];
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function genPassword() {
  let out = '';
  for (let i = 0; i < 14; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export default function UserAdminForm({ target, isSelf }) {
  const router = useRouter();
  const [role, setRole] = useState(target.role);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');
  const [roleOk, setRoleOk] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [shownPassword, setShownPassword] = useState('');

  async function saveRole(ev) {
    ev.preventDefault();
    setRoleMsg('');
    setRoleOk(false);
    setRoleBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not update access level');
      setRoleOk(true);
      setRoleMsg('Access level updated.');
      router.refresh();
    } catch (err) {
      setRoleMsg(err.message || 'Could not update access level');
    } finally {
      setRoleBusy(false);
    }
  }

  async function resetPassword(ev) {
    ev.preventDefault();
    setPwMsg('');
    setPwBusy(true);
    const pw = newPassword.trim() || genPassword();
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not reset password');
      setShownPassword(pw);
      setNewPassword('');
      setPwMsg('Password reset. Share this with them securely — it will not be shown again.');
    } catch (err) {
      setPwMsg(err.message || 'Could not reset password');
      setShownPassword('');
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <>
      <h2><span className="bar">/</span> ACCESS LEVEL</h2>
      <form className="stack" onSubmit={saveRole} style={{ maxWidth: 360 }}>
        {roleMsg && <div className={roleOk ? 'flash' : 'error-box'}>{roleMsg}</div>}
        <div className="field">
          <label>ROLE</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} disabled={isSelf}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {isSelf
          ? <p className="muted" style={{ fontSize: 12 }}>You can't change your own access level.</p>
          : <div className="cta-row"><button className="btn btn-sm" type="submit" disabled={roleBusy}>{roleBusy ? 'SAVING…' : 'SAVE ACCESS LEVEL'}</button></div>}
      </form>

      <h2><span className="bar">/</span> RESET PASSWORD</h2>
      <form className="stack" onSubmit={resetPassword} style={{ maxWidth: 360 }}>
        {pwMsg && <div className={shownPassword ? 'flash' : 'error-box'}>{pwMsg}</div>}
        {shownPassword && <p style={{ fontFamily: 'monospace', fontSize: 18, background: 'var(--panel-2)', padding: '10px 14px', borderRadius: 6 }}>{shownPassword}</p>}
        <div className="field">
          <label>NEW PASSWORD (leave blank to auto-generate)</label>
          <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to generate a random one" />
        </div>
        <div className="cta-row"><button className="btn btn-warn btn-sm" type="submit" disabled={pwBusy}>{pwBusy ? 'RESETTING…' : 'RESET PASSWORD'}</button></div>
      </form>
    </>
  );
}
