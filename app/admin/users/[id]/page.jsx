import { redirect, notFound } from 'next/navigation';
import { db } from '../../../../lib/db';
import { currentUser } from '../../../../lib/auth';
import UserAdminForm from '../../../../components/UserAdminForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage User' };

export default async function AdminUserDetail({ params }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'admin') redirect('/admin');

  const sql = await db();
  const rows = await sql`SELECT id, name, email, role, created_at FROM users WHERE id = ${params.id}`;
  const target = rows[0];
  if (!target) notFound();

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>{target.name}</h1></div>
      <p className="muted" style={{ marginTop: 6 }}>{target.email} · joined {new Date(target.created_at).toLocaleDateString()}</p>
      <UserAdminForm target={target} isSelf={target.id === user.id} />
    </>
  );
}
