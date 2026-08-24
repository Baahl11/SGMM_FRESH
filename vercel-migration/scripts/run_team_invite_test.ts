import path from 'path';
import crypto from 'crypto';
import { config as loadEnv } from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.production');
loadEnv({ path: envPath });

function getProviderResponseBody(error: unknown): unknown {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'body' in error.response
  ) {
    return error.response.body;
  }
  return undefined;
}

async function main() {
  const [{ supabaseAdmin }, { ROLE_PERMISSIONS }, { generateTeamInvitationEmail }, { emailService }] = await Promise.all([
    import('@/lib/supabase/server'),
    import('@/lib/types/team'),
    import('@/lib/email-templates/team-invitation'),
    import('@/lib/email-service')
  ]);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Make sure .env.production is present.');
  }

  const ownerEmail = `test-owner+${Date.now()}@mailinator.com`;
  const invitedEmail = `team-invite+${Date.now()}@mailinator.com`;
  const ownerPassword = `Temp1!${Date.now()}`;

  console.log('🚀 Creating temporary owner account for invitation test...');

  const { data: ownerResult, error: ownerError } = await supabaseAdmin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Team Owner Test',
      onboarding_completed: true
    }
  });

  if (ownerError || !ownerResult?.user) {
    throw new Error(`Failed to create owner user: ${ownerError?.message}`);
  }

  const ownerId = ownerResult.user.id;
  const ownerDisplayName = ownerResult.user.user_metadata?.full_name || ownerEmail.split('@')[0];

  console.log('✅ Owner account ready:', ownerId);

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const role: keyof typeof ROLE_PERMISSIONS = 'doctor';
  const permissions = ROLE_PERMISSIONS[role];

  console.log('🗂️  Inserting pending team invitation...');

  const { data: invitationRow, error: invitationError } = await supabaseAdmin
    .from('team_members')
    .insert({
      owner_user_id: ownerId,
      member_email: invitedEmail,
      role,
      status: 'pending',
      invitation_token: invitationToken,
      permissions
    })
    .select()
    .single();

  if (invitationError || !invitationRow) {
    throw new Error(`Failed to insert invitation: ${invitationError?.message}`);
  }

  console.log('✅ Invitation record created:', invitationRow.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://agendamedpro.com';
  const invitationUrl = `${siteUrl}/team/accept?token=${invitationToken}`;

  const emailTemplate = generateTeamInvitationEmail({
    invitedEmail,
    ownerEmail,
    ownerName: ownerDisplayName,
    role,
    invitationUrl
  });

  const maskedToken = `${invitationToken.slice(0, 6)}...${invitationToken.slice(-4)}`;

  console.log('ℹ️  Invitation URL (token masked):', invitationUrl.replace(invitationToken, maskedToken));
  console.log('👤 Owner email:', ownerEmail);
  console.log('📨 Invited email:', invitedEmail);
  console.log('🔐 Full token stored in database; query table team_members if acceptance testing is required.');

  console.log('📧 Dispatching invitation email through configured provider...');

  const sendResult = await emailService
    .sendCustomEmail(invitedEmail, emailTemplate.subject, emailTemplate.html, true)
    .catch((sendError: unknown) => {
      const responseBody = getProviderResponseBody(sendError);
      if (responseBody) {
        console.error('❗ Provider response body:', responseBody);
      }
      throw sendError;
    });

  console.log('✅ Email service responded:', {
    to: sendResult.to,
    provider: sendResult.provider,
    messageId: sendResult.messageId
  });
}

main().catch((error) => {
  console.error('❌ Invitation test failed:', error);
  process.exit(1);
});
