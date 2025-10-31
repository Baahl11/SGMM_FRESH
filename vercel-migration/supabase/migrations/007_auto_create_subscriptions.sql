-- Auto-create enterprise subscription when invitation is accepted
-- This prevents the 406 error for new users without subscriptions

-- Function to create subscription when invitation is accepted
CREATE OR REPLACE FUNCTION create_subscription_on_invitation_accept()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only create subscription when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Find the user with this email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = NEW.email
    LIMIT 1;
    
    -- If user found and doesn't have subscription, create one
    IF target_user_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM subscriptions WHERE user_id = target_user_id
      ) THEN
        -- Create enterprise subscription for the new user
        INSERT INTO subscriptions (
          user_id,
          plan_tier,
          max_doctors,
          max_locations,
          features,
          status,
          stripe_price_id
        ) VALUES (
          target_user_id,
          'enterprise',
          999,
          999,
          '["unlimited_doctors", "unlimited_locations", "advanced_analytics", "priority_support"]'::jsonb,
          'active',
          'price_enterprise_manual'
        );
        
        RAISE NOTICE 'Created enterprise subscription for user % (email: %)', target_user_id, NEW.email;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on invitations table
DROP TRIGGER IF EXISTS auto_create_subscription_on_accept ON invitations;
CREATE TRIGGER auto_create_subscription_on_accept
  AFTER UPDATE OF status ON invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION create_subscription_on_invitation_accept();

-- Also create subscription for users who register normally (not via invitation)
CREATE OR REPLACE FUNCTION create_subscription_on_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Wait 5 seconds to let the user profile be created
  -- Then create a basic subscription if they don't have one
  INSERT INTO subscriptions (
    user_id,
    plan_tier,
    max_doctors,
    max_locations,
    features,
    status,
    stripe_price_id,
    trial_start,
    trial_end
  )
  SELECT 
    NEW.id,
    'basico',
    2,
    1,
    '["basic_scheduling", "basic_patients"]'::jsonb,
    'trialing',
    'price_basico_default',
    NOW(),
    NOW() + INTERVAL '7 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS auto_create_subscription_on_signup ON auth.users;
CREATE TRIGGER auto_create_subscription_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_user_signup();

COMMENT ON FUNCTION create_subscription_on_invitation_accept() IS 'Automatically creates enterprise subscription when user accepts invitation';
COMMENT ON FUNCTION create_subscription_on_user_signup() IS 'Automatically creates basic subscription for new user signups';
