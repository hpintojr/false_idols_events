import Link from 'next/link';
import { currentUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminLayout({ children }) {
  const user = await currentUser();
  return (
    <div className="admin">
      {user && (
        <div className="site-header" style={{ position: 'static', borderTop: 'none' }}>
          <nav className="site-nav">
            <Link href="/admin">DASHBOARD</Link>
            <Link href="/admin/events">EVENTS</Link>
            <Link href="/admin/media">MEDIA</Link>
          </nav>
          <div className="admin-user">
            <span>{user.name} · {user.role}</span>
            <form method="post" action="/api/logout" className="inline"><button className="btn btn-ghost btn-sm">LOG OUT</button></form>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
