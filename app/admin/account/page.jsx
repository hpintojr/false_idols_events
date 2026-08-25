import { redirect } from 'next/navigation';
import { currentUser } from '../../../lib/auth';
import PasswordForm from '../../../components/PasswordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Account' };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>MY ACCOUNT</h1></div>
      <p className="muted" style={{ marginTop: 6 }}>{user.name} · {user.email} · {user.role}</p>
      <h2><span className="bar">/</span> CHANGE PASSWORD</h2>
      <PasswordForm />
    </>
  );
}
