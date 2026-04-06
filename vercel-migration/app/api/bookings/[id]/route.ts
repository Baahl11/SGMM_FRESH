import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { status, clinic_notes } = body;

    console.log('[PATCH /api/bookings/[id]]', { bookingId, status, clinic_notes });

    // Verify booking belongs to this clinic
    const { data: booking, error: fetchError } = await supabase
      .from('public_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('clinic_user_id', user.id)
      .single();

    if (fetchError || !booking) {
      console.error('[PATCH /api/bookings/[id]] Booking not found:', fetchError);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (clinic_notes !== undefined) updateData.clinic_notes = clinic_notes;

    const { data: updated, error } = await supabase
      .from('public_bookings')
      .update(updateData)
      .eq('id', bookingId)
      .eq('clinic_user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ error: 'Error updating booking' }, { status: 500 });
    }

    // Send notification if status changed
    if (status && status !== booking.status) {
      try {
        let eventType = '';
        if (status === 'confirmed') eventType = 'booking_confirmed';
        else if (status === 'cancelled') eventType = 'booking_cancelled';

        if (eventType) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              booking_id: bookingId,
              event_type: eventType,
              send_email: true,
              send_whatsapp: true,
            }),
          }).catch(err => console.warn('Notification failed:', err));
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the update if notification fails
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Delete booking (only if belongs to this clinic)
    const { error } = await supabase
      .from('public_bookings')
      .delete()
      .eq('id', bookingId)
      .eq('clinic_user_id', user.id);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json({ error: 'Error deleting booking' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
