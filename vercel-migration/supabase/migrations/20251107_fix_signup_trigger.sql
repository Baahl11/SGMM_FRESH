-- Fix signup trigger to bypass RLS when auto-creating subscriptions
-- Created: 2025-11-07
-- Context: OAuth signups were failing with "Database error saving new user"
--         because the trigger create_subscription_on_user_signup() attempted
--         to insert into subscriptions while RLS was active. The trigger did
--         not impersonate the service role, so the insert was rejected and
--         the auth.users insert aborted. This version runs the insert while
--         temporarily flagging the request as service_role and wraps the
--         operation in a defensive exception block to avoid hard failures.

CREATE OR REPLACE FUNCTION create_subscription_on_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  trial_start TIMESTAMPTZ;
  trial_end TIMESTAMPTZ;
BEGIN
  -- Ensure RLS policies that rely on auth.role() see service_role
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  -- Basic 7-day trial window
  trial_start := NOW();
  trial_end := trial_start + INTERVAL '7 days';

  INSERT INTO subscriptions (
    user_id,
    plan_tier,
    max_doctors,
    max_locations,
    features,
    status,
    stripe_price_id,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end
  )
  SELECT
    NEW.id,
    'basico',
    2,
    1,
    '["basic_scheduling", "basic_patients"]'::jsonb,
    'trialing',
    'price_basico_default',
    trial_start,
    trial_end,
    trial_start,
    trial_end
  WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block auth signup; log for later inspection instead
    RAISE NOTICE '[create_subscription_on_user_signup] Skipping auto-create for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
