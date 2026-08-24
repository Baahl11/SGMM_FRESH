-- Reporte rápido del embudo autoservicio.
-- Ajustar la ventana en `window_start` según la campaña.

WITH params AS (
  SELECT '2026-06-18 00:00:00-06'::timestamptz AS window_start
),
events AS (
  SELECT
    event_name,
    COALESCE(first_touch_source, '(sin source)') AS source,
    COALESCE(first_touch_medium, '(sin medium)') AS medium,
    COALESCE(first_touch_campaign, '(sin campaign)') AS campaign,
    COALESCE(first_touch_content, '(sin content)') AS content,
    anonymous_id,
    user_id,
    created_at
  FROM public.funnel_events, params
  WHERE created_at >= params.window_start
)
SELECT
  source,
  medium,
  campaign,
  content,
  COUNT(*) FILTER (WHERE event_name = 'calculator_view') AS calculator_views,
  COUNT(*) FILTER (WHERE event_name = 'calculator_cta') AS calculator_ctas,
  COUNT(*) FILTER (WHERE event_name = 'trial_landing_view') AS landing_views,
  COUNT(*) FILTER (WHERE event_name = 'trial_landing_cta') AS landing_ctas,
  COUNT(*) FILTER (WHERE event_name = 'signup_view') AS signup_views,
  COUNT(*) FILTER (WHERE event_name = 'signup_success') AS signup_success,
  COUNT(*) FILTER (WHERE event_name = 'select_trial_plan_view') AS plan_views,
  COUNT(*) FILTER (WHERE event_name = 'plan_select_clicked') AS plan_clicks,
  COUNT(*) FILTER (WHERE event_name = 'checkout_started') AS checkout_started,
  COUNT(*) FILTER (WHERE event_name = 'trial_started') AS trial_started,
  COUNT(DISTINCT anonymous_id) AS anonymous_visitors,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS known_users
FROM events
GROUP BY source, medium, campaign, content
ORDER BY calculator_views DESC, landing_views DESC;

-- Serie por hora para detectar fugas por etapa.
WITH params AS (
  SELECT '2026-06-18 00:00:00-06'::timestamptz AS window_start
)
SELECT
  date_trunc('hour', created_at AT TIME ZONE 'America/Mexico_City') AS hour_mx,
  event_name,
  COUNT(*) AS events,
  COUNT(DISTINCT anonymous_id) AS anonymous_visitors
FROM public.funnel_events, params
WHERE created_at >= params.window_start
GROUP BY 1, 2
ORDER BY 1, 2;
