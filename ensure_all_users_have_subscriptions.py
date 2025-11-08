"""
Ensure all users have a subscription (basico plan by default)
"""
import os
from supabase import create_client

def main():
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase = create_client(url, key)
    
    print("🔍 Checking users without subscriptions...")
    
    # Get all users
    users_response = supabase.auth.admin.list_users()
    all_users = users_response
    
    if hasattr(all_users, 'users'):
        users = all_users.users
    else:
        users = all_users
    
    print(f"📊 Found {len(users)} total users")
    
    # Get existing subscriptions
    subs_response = supabase.table('subscriptions').select('user_id').execute()
    existing_user_ids = {sub['user_id'] for sub in subs_response.data}
    
    print(f"📊 {len(existing_user_ids)} users already have subscriptions")
    
    # Find users without subscriptions
    users_without_subs = [u for u in users if u.id not in existing_user_ids]
    
    print(f"\n⚠️  {len(users_without_subs)} users WITHOUT subscriptions:")
    for user in users_without_subs:
        email = user.email or 'No email'
        print(f"   - {email} ({user.id})")
    
    if not users_without_subs:
        print("\n✅ All users have subscriptions!")
        return
    
    response = input(f"\n❓ Create BASICO subscriptions for {len(users_without_subs)} users? (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Cancelled")
        return
    
    print("\n🚀 Creating subscriptions...")
    
    for user in users_without_subs:
        try:
            supabase.table('subscriptions').insert({
                'user_id': user.id,
                'plan_tier': 'basico',
                'max_doctors': 2,
                'max_locations': 1,
                'features': ['basic_scheduling', 'basic_patients'],
                'status': 'active',
                'stripe_price_id': 'price_basico_default'
            }).execute()
            print(f"   ✅ Created subscription for {user.email}")
        except Exception as e:
            print(f"   ❌ Error for {user.email}: {e}")
    
    print("\n✅ Done!")

if __name__ == "__main__":
    main()
