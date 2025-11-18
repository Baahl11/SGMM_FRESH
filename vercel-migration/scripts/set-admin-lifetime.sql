-- ============================================
-- UPDATE: Set Admin Account to Lifetime Enterprise
-- Date: 2025-11-18
-- Purpose: Update main admin account to Lifetime/Enterprise with full access
-- ============================================

-- 1. First, check current subscription status
SELECT 
  u.id as user_id,
  u.email,
  s.id as subscription_id,
  s.plan_tier,
  s.status,
  s.max_doctors,
  s.max_locations,
  s.created_at
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
WHERE u.email = 'gm_melgarejo@hotmail.com' -- Tu email
ORDER BY s.created_at DESC;

-- 2. Delete ALL existing subscriptions for this user (clean slate)
DELETE FROM subscriptions
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'gm_melgarejo@hotmail.com'
);

-- 3. Create new Lifetime Enterprise subscription
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_tier,
  status,
  max_doctors,
  max_locations,
  features,
  current_period_start,
  current_period_end,
  trial_start,
  trial_end,
  created_at,
  updated_at
)
SELECT 
  u.id,
  NULL, -- No Stripe customer (admin account)
  'admin_lifetime_' || u.id::text, -- Fake subscription ID for admin
  'price_1SUsQzCpe9CE4d2lfkuw7S3T', -- Lifetime price ID
  'enterprise', -- Enterprise tier
  'active', -- Active status
  999, -- Unlimited doctors
  999, -- Unlimited locations
  '["all"]'::jsonb, -- All features
  NOW(), -- Started now
  NOW() + INTERVAL '100 years', -- Never expires
  NULL, -- No trial
  NULL,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'gm_melgarejo@hotmail.com';

-- 4. Also update user role to admin (if not already)
UPDATE users
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'gm_melgarejo@hotmail.com');

-- 5. Verify the update
SELECT 
  u.id,
  u.email,
  users.name,
  users.role,
  s.plan_tier,
  s.status,
  s.max_doctors,
  s.max_locations,
  s.features
FROM auth.users u
LEFT JOIN users ON users.id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'gm_melgarejo@hotmail.com';

-- Should show:
-- role: admin
-- plan_tier: enterprise
-- status: active
-- max_doctors: 999
-- max_locations: 999
-- features: ["all"]
