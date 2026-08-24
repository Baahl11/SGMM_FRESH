-- Self-service trials start only after an authenticated user selects Pro or Enterprise.
-- Existing subscriptions are intentionally left untouched.

DROP TRIGGER IF EXISTS auto_create_subscription_on_signup ON auth.users;

COMMENT ON FUNCTION public.create_subscription_on_user_signup() IS
  'Legacy signup hook. Disabled on 2026-06-23; trials are activated after explicit plan selection.';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_origin text,
  ADD COLUMN IF NOT EXISTS billing_cycle text;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_trial_origin_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_trial_origin_check
  CHECK (trial_origin IS NULL OR trial_origin IN ('self_service_no_card', 'stripe'));

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_billing_cycle_check
  CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'annual'));

-- The production audit showed no duplicates. This also makes trial activation race-safe.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique
  ON public.subscriptions (user_id);

CREATE OR REPLACE FUNCTION public.user_has_valid_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = user_uuid
      AND (
        status = 'active'
        OR (status = 'trialing' AND trial_end > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_valid_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_valid_subscription(uuid) TO authenticated;

COMMENT ON FUNCTION public.user_has_valid_subscription(uuid) IS
  'Access is valid for active subscriptions or non-expired trials. A Stripe id alone never grants access.';

