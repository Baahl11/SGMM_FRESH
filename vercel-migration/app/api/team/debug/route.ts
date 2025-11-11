/**
 * Debug endpoint to test team_members table access
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ 
        step: 'auth',
        error: authError.message,
        success: false 
      });
    }

    if (!user) {
      return NextResponse.json({ 
        step: 'auth',
        error: 'No authenticated user',
        success: false 
      });
    }

    // 2. Check subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_tier, max_doctors')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      return NextResponse.json({ 
        step: 'subscription',
        error: subError.message,
        user_id: user.id,
        success: false 
      });
    }

    // 3. Try to query team_members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_user_id', user.id);

    if (membersError) {
      return NextResponse.json({ 
        step: 'team_members_query',
        error: membersError.message,
        code: membersError.code,
        details: membersError.details,
        hint: membersError.hint,
        user_id: user.id,
        success: false 
      });
    }

    // 4. Try to insert a test member (then delete it)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: testInsert, error: insertError } = await supabase
      .from('team_members')
      .insert({
        owner_user_id: user.id,
        member_email: testEmail,
        role: 'viewer',
        status: 'pending',
        invitation_token: 'test-token-' + Date.now()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ 
        step: 'team_members_insert',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        success: false 
      });
    }

    // Delete test record
    await supabase
      .from('team_members')
      .delete()
      .eq('id', testInsert.id);

    // Success!
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      subscription: {
        plan: subscription?.plan_tier,
        max_doctors: subscription?.max_doctors
      },
      team_members: {
        count: members?.length || 0,
        members: members
      },
      test_insert: {
        success: true,
        record: testInsert
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      step: 'unexpected',
      error: error.message,
      stack: error.stack,
      success: false
    }, { status: 500 });
  }
}
