import { redirect } from 'next/navigation';
import { currentUser } from '../../../../lib/auth';
import EventForm from '../../../../components/EventForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create Event' };

export default async function NewEvent() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>CREATE EVENT</h1></div>
      <EventForm role={user.role} />
    </>
  );
}
