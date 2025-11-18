-- ============================================
-- CLEANUP: Duplicate Subscriptions
-- Date: 2025-11-18
-- Purpose: Remove duplicate subscriptions, keep only the most recent active one per user
-- ============================================

-- 1. View current duplicates
SELECT 
  user_id,
  COUNT(*) as subscription_count,
  ARRAY_AGG(id ORDER BY created_at DESC) as subscription_ids,
  ARRAY_AGG(status ORDER BY created_at DESC) as statuses,
  ARRAY_AGG(plan_tier ORDER BY created_at DESC) as tiers
FROM subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 2. Delete duplicates, keeping only the most recent subscription per user
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE 
          WHEN status = 'active' THEN 1
          WHEN status = 'trialing' THEN 2
          ELSE 3
        END,
        created_at DESC
    ) as rn
  FROM subscriptions
  WHERE status IN ('active', 'trialing', 'past_due')
)
DELETE FROM subscriptions
WHERE id IN (
  SELECT id 
  FROM ranked_subscriptions 
  WHERE rn > 1
);

-- 3. Verify cleanup
SELECT 
  user_id,
  COUNT(*) as subscription_count
FROM subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Should return 0 rows if cleanup successful

-- 4. Add UNIQUE constraint to prevent future duplicates
-- (COMMENTED - Run manually if you want to enforce this)
-- CREATE UNIQUE INDEX idx_subscriptions_unique_active_user 
--   ON subscriptions (user_id) 
--   WHERE status IN ('active', 'trialing');
