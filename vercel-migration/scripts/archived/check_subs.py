from supabase import create_client
import os

s = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
users = s.auth.admin.list_users()
subs = s.table('subscriptions').select('*').execute()

print(f'📊 Total users: {len(users)}')
print(f'📊 Total subscriptions: {len(subs.data)}')
print('\n🔍 Subscriptions in database:')
for sub in subs.data:
    print(f\"  User: {sub['user_id'][:8]}... | Plan: {sub['plan_tier']} | Status: {sub['status']}\")

if len(users) > len(subs.data):
    print(f'\n⚠️  {len(users) - len(subs.data)} users WITHOUT subscriptions!')
