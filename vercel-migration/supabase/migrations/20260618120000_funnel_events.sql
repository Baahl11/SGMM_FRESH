-- Eventos anónimos del embudo autoservicio.
-- Tabla aditiva y aislada. ROLLBACK:
-- DROP TABLE IF EXISTS public.funnel_events;

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_path text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funnel_events_event_name_check CHECK (
    event_name IN (
      'calculator_view',
      'calculator_cta',
      'trial_landing_view',
      'trial_landing_cta',
      'signup_view',
      'signup_success',
      'select_trial_plan_view',
      'plan_select_clicked',
      'checkout_started',
      'trial_started'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_name_created
  ON public.funnel_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_campaign
  ON public.funnel_events (first_touch_source, first_touch_campaign, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_anonymous
  ON public.funnel_events (anonymous_id, created_at DESC)
  WHERE anonymous_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_funnel_events_user
  ON public.funnel_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.funnel_events IS
  'Eventos anónimos del embudo publicitario calculadora -> trial. Escritura server-side con service role.';
