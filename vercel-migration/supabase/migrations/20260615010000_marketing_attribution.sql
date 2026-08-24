-- Atribución del embudo autoservicio. Tabla aditiva y aislada.
-- ROLLBACK: DROP TABLE IF EXISTS public.marketing_attribution;

CREATE TABLE IF NOT EXISTS public.marketing_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id text,
  first_touch_source text,
  first_touch_medium text,
  first_touch_campaign text,
  first_touch_content text,
  first_touch_term text,
  first_touch_gclid text,
  first_touch_fbclid text,
  last_touch_source text,
  last_touch_medium text,
  last_touch_campaign text,
  last_touch_content text,
  last_touch_term text,
  last_touch_gclid text,
  last_touch_fbclid text,
  landing_page text,
  referrer text,
  calculator_monthly_loss numeric,
  calculator_average_ticket numeric,
  calculator_missed_appointments integer,
  calculator_appointments_to_cover integer,
  calculator_recoverable_monthly numeric,
  signup_created_at timestamptz,
  checkout_started_at timestamptz,
  trial_started_at timestamptz,
  subscription_started_at timestamptz,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_attribution_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_marketing_attribution_campaign
  ON public.marketing_attribution (last_touch_source, last_touch_campaign);
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_checkout
  ON public.marketing_attribution (checkout_started_at DESC)
  WHERE checkout_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_trial
  ON public.marketing_attribution (trial_started_at DESC)
  WHERE trial_started_at IS NOT NULL;

ALTER TABLE public.marketing_attribution ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.marketing_attribution IS
  'Atribución first/last touch del embudo calculadora -> trial. Escritura server-side con service role.';
