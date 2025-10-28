/**
 * Test Auto-Reminders Cron Job Locally
 * Run: node test_cron_reminders.js
 */

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

async function testCronJob() {
  try {
    console.log('🧪 Testing auto-reminders cron job...\n');
    
    // Get the base URL from env or use localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/cron/reminders`;
    
    console.log(`📡 Calling: ${url}`);
    console.log(`🔑 Using secret: ${CRON_SECRET}\n`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}\n`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cron job completed successfully!\n');
      console.log('📊 Results:');
      console.log(`   Users processed: ${data.users_processed}`);
      console.log(`   Users skipped (DND): ${data.users_skipped_dnd}`);
      console.log(`   Total reminders: ${data.total_reminders}\n`);
      
      console.log('📋 Breakdown:');
      console.log(`   Unsent invoices: ${data.reminders_created.unsent_invoices}`);
      console.log(`   Unpaid invoices: ${data.reminders_created.unpaid_invoices}`);
      console.log(`   Expiring certificates: ${data.reminders_created.expiring_certificates}`);
      console.log(`   Upcoming appointments: ${data.reminders_created.upcoming_appointments}`);
      console.log(`   Low inventory: ${data.reminders_created.low_inventory}\n`);
      
      if (data.errors && data.errors.length > 0) {
        console.log('⚠️ Errors:');
        data.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.log('❌ Cron job failed:\n');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing cron job:', error);
  }
}

testCronJob();
