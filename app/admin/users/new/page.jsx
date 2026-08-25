import { redirect } from 'next/navigation';
import { currentUser } from '../../../../lib/auth';
import NewUserForm from '../../../../components/NewUserForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create User' };

export default async function NewUserPage() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'admin') redirect('/admin');

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>CREATE USER</h1></div>
      <NewUserForm />
    </>
  );
}
