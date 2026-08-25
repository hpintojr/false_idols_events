import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '../../../lib/db';
import { currentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Users' };

const ROLE_PILL = { admin: 'approved', user: 'submitted', suspended: 'rejected' };

export default async function AdminUsers() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'admin') redirect('/admin');

  const sql = await db();
  const rows = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`;

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>USERS</h1></div>
      <div className="cta-row" style={{ marginTop: 14 }}><Link className="btn" href="/admin/users/new">+ CREATE USER</Link></div>
      <div className="table-wrap"><table className="list"><tbody>
        <tr><th>Name</th><th>Email</th><th>Access Level</th><th>Joined</th><th></th></tr>
        {rows.map((u) => (
          <tr key={u.id}>
            <td><strong>{u.name}</strong>{u.id === user.id ? <span className="muted"> (you)</span> : ''}</td>
            <td>{u.email}</td>
            <td><span className={`status-pill st-${ROLE_PILL[u.role] || 'draft'}`}>{u.role}</span></td>
            <td>{new Date(u.created_at).toLocaleDateString()}</td>
            <td><Link className="btn btn-ghost btn-sm" href={`/admin/users/${u.id}`}>MANAGE</Link></td>
          </tr>
        ))}
      </tbody></table></div>
    </>
  );
}
