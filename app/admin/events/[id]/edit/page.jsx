import { redirect, notFound } from 'next/navigation';
import { db } from '../../../../../lib/db';
import { currentUser } from '../../../../../lib/auth';
import EventForm from '../../../../../components/EventForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Event' };

export default async function EditEvent({ params }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  const sql = await db();
  const rows = await sql`SELECT * FROM events WHERE id = ${params.id}`;
  const event = rows[0];
  if (!event) notFound();
  if (user.role !== 'admin' && event.submitted_by !== user.id) redirect('/admin/events');

  return (
    <>
      <div className="hero" style={{ padding: '24px 0 0' }}><h1>{user.role === 'admin' ? 'EDIT EVENT' : 'MY EVENT'}</h1></div>
      <EventForm event={event} role={user.role} userId={user.id} />
    </>
  );
}
