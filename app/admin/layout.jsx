import Link from 'next/link';
import { currentUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminLayout({ children }) {
  const user = await currentUser();
  const isAdmin = user && user.role === 'admin';
  return (
    <div className="admin">
      {user && (
        <div className="site-header" style={{ position: 'static', borderTop: 'none' }}>
          <nav className="site-nav">
            <Link href="/admin">DASHBOARD</Link>
            <Link href="/admin/events">{isAdmin ? 'EVENTS' : 'MY EVENTS'}</Link>
            <Link href="/admin/media">MEDIA</Link>
            {isAdmin && <Link href="/admin/users">USERS</Link>}
          </nav>
          <div className="admin-user">
            <span>{user.name} · {user.role}</span>
            <Link href="/admin/account" className="btn btn-ghost btn-sm">ACCOUNT</Link>
            <form method="post" action="/api/logout" className="inline"><button className="btn btn-ghost btn-sm">LOG OUT</button></form>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
