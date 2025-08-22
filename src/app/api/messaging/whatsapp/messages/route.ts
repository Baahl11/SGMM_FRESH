import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = false;

export async function GET(request: NextRequest) {
  try {
    // Endpoint deprecated - redirect to new system
    console.log('⚠️ Deprecated endpoint called: /api/messaging/whatsapp/messages/');
    
    return NextResponse.json({
      success: true,
      data: [],
      message: 'This endpoint has been deprecated. Please use the new messaging system.',
      deprecated: true,
      redirect_to: '/api/messaging/appointments/upcoming'
    });
  } catch (error) {
    console.error('Error in deprecated WhatsApp messages endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Endpoint deprecated',
      message: 'Please use the updated messaging system'
    }, { status: 410 }); // Gone
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Endpoint deprecated',
    message: 'WhatsApp messaging has been integrated into the main messaging system'
  }, { status: 410 });
}
