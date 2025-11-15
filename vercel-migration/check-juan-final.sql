-- VERIFICAR CONFIGURACIÓN ACTUAL DE JUAN
SELECT 
  u.id,
  u.email,
  s.plan_tier,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_end,
  s.trial_end,
  CASE 
    WHEN s.trial_end IS NOT NULL AND s.trial_end > NOW() THEN 'EN TRIAL'
    WHEN s.current_period_end < NOW() THEN 'VENCIDO'
    ELSE 'ACTIVO'
  END as estado
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'asc.admon23@gmail.com';
