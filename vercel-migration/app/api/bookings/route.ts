import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, confirmed, cancelled, completed
    const date = searchParams.get('date'); // YYYY-MM-DD

    let query = supabase
      .from('public_bookings')
      .select('*')
      .eq('clinic_user_id', user.id)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('booking_date', date);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      today: bookings.filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.booking_date === today;
      }).length
    };

    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
