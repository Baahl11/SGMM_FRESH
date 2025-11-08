import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, userName, planName, daysRemaining, trialEndDate } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await emailService.sendTrialExpirationReminder(
      email,
      userName || 'Usuario',
      planName || 'Básico',
      daysRemaining || 2,
      trialEndDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder email sent successfully',
      result 
    });

  } catch (error: any) {
    console.error('Error sending reminder email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
