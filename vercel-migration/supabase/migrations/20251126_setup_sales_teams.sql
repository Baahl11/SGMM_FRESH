-- ============================================
-- CONFIGURACIÓN INICIAL: Sistema de Referidos
-- ============================================
-- Ejecutar este script DESPUÉS de la migración principal
-- Reemplaza los valores entre < > con tus datos reales

-- ============================================
-- 1. CREAR CUENTA CONNECT PARA LA DISTRIBUIDORA
-- ============================================

-- Opción A: Si la distribuidora ya tiene un user_id en tu sistema
INSERT INTO connected_accounts (
  user_id, 
  sales_team, 
  onboarding_completed,
  charges_enabled
) VALUES (
  '<USER_ID_DEL_DISTRIBUIDOR>',  -- Reemplazar con el user_id real
  'distributor',
  false,  -- Cambiará a true cuando completen el onboarding
  false   -- Cambiará a true cuando Stripe lo apruebe
)
ON CONFLICT (sales_team) DO NOTHING;

-- Opción B: Si necesitas crear el usuario primero
-- INSERT INTO users (id, email, full_name, role)
-- VALUES (
--   gen_random_uuid(),
--   'distribuidor@ejemplo.com',
--   'Nombre Distribuidora',
--   'admin'
-- );
-- 
-- Luego usa el ID generado en la query de arriba

-- ============================================
-- 2. CREAR CUENTA CONNECT PARA TU EQUIPO INTERNO (Opcional)
-- ============================================
-- Solo si quieres rastrear tu equipo también en Connect
-- (normalmente no es necesario ya que usas tu cuenta principal)

-- INSERT INTO connected_accounts (
--   user_id, 
--   sales_team, 
--   onboarding_completed,
--   charges_enabled
-- ) VALUES (
--   '<TU_USER_ID>',
--   'internal',
--   true,
--   true
-- )
-- ON CONFLICT (sales_team) DO NOTHING;

-- ============================================
-- 3. VERIFICAR CONFIGURACIÓN
-- ============================================

-- Ver todas las cuentas connect configuradas
SELECT 
  ca.id,
  ca.sales_team,
  ca.stripe_account_id,
  ca.onboarding_completed,
  ca.charges_enabled,
  ca.created_at,
  u.email as user_email
FROM connected_accounts ca
LEFT JOIN users u ON ca.user_id = u.id
ORDER BY ca.created_at DESC;

-- ============================================
-- 4. VERIFICAR SUSCRIPCIONES EXISTENTES
-- ============================================

-- Si ya tienes suscripciones, marcarlas como 'internal' por defecto
UPDATE subscriptions 
SET 
  sales_team = 'internal',
  application_fee_percent = 0,
  referral_source = 'legacy'
WHERE sales_team IS NULL;

-- Ver distribución de ventas por equipo
SELECT 
  sales_team,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
  SUM(CASE WHEN status = 'active' THEN platform_fee_amount ELSE 0 END) as total_fees_earned
FROM subscriptions
GROUP BY sales_team;

-- ============================================
-- 5. CONFIGURAR PERMISOS (RLS) SI APLICA
-- ============================================

-- Permitir que la distribuidora vea solo sus ventas
-- CREATE POLICY "Distribuidores ven solo sus ventas"
-- ON subscriptions FOR SELECT
-- USING (
--   auth.uid() IN (
--     SELECT user_id FROM connected_accounts 
--     WHERE sales_team = (
--       SELECT sales_team FROM connected_accounts WHERE user_id = auth.uid()
--     )
--   )
-- );

-- ============================================
-- 6. FUNCIONES AUXILIARES
-- ============================================

-- Función para calcular comisiones totales por periodo
CREATE OR REPLACE FUNCTION calculate_team_revenue(
  team_name TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_sales BIGINT,
  gross_revenue NUMERIC,
  platform_fees NUMERIC,
  net_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sales,
    SUM(
      CASE 
        WHEN plan_tier = 'basico' THEN 599
        WHEN plan_tier = 'pro' THEN 999
        WHEN plan_tier = 'enterprise' THEN 2999
        ELSE 0
      END
    ) as gross_revenue,
    SUM(platform_fee_amount) as platform_fees,
    SUM(
      CASE 
        WHEN plan_tier = 'basico' THEN 599
        WHEN plan_tier = 'pro' THEN 999
        WHEN plan_tier = 'enterprise' THEN 2999
        ELSE 0
      END
    ) - SUM(COALESCE(platform_fee_amount, 0)) as net_revenue
  FROM subscriptions
  WHERE sales_team = team_name
    AND created_at BETWEEN start_date AND end_date
    AND status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM calculate_team_revenue('internal', '2025-01-01', '2025-12-31');
-- SELECT * FROM calculate_team_revenue('distributor', '2025-01-01', '2025-12-31');

-- ============================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Ya están creados en la migración principal, pero verifica:
-- CREATE INDEX IF NOT EXISTS idx_subscriptions_sales_team ON subscriptions(sales_team);
-- CREATE INDEX IF NOT EXISTS idx_subscriptions_referral_source ON subscriptions(referral_source);
-- CREATE INDEX IF NOT EXISTS idx_subscription_addons_sales_team ON subscription_addons(sales_team);

-- ============================================
-- 8. QUERY DE MONITOREO
-- ============================================

-- Dashboard rápido: Ver últimas 10 ventas por equipo
SELECT 
  s.created_at,
  s.sales_team,
  s.plan_tier,
  s.referral_source,
  s.application_fee_percent,
  s.platform_fee_amount,
  u.email,
  s.status
FROM subscriptions s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 10;

-- Ver balance de comisiones del mes actual
SELECT 
  sales_team,
  COUNT(*) as ventas,
  SUM(platform_fee_amount) as comisiones_cobradas,
  SUM(
    CASE 
      WHEN plan_tier = 'basico' THEN 599
      WHEN plan_tier = 'pro' THEN 999
      WHEN plan_tier = 'enterprise' THEN 2999
      ELSE 0
    END
  ) as ingresos_brutos
FROM subscriptions
WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND status IN ('active', 'trialing')
GROUP BY sales_team;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Después de ejecutar este script, la distribuidora debe:
--    - Hacer login en tu app
--    - Ir a la URL de onboarding de Stripe Connect
--    - Completar el formulario (banco, identificación, etc)
--    - Esperar aprobación de Stripe (puede tardar minutos u horas)

-- 2. Para probar en desarrollo:
--    - Usa Stripe Test Mode
--    - Las cuentas Connect en test mode se aprueban instantáneamente
--    - Usa tarjeta de prueba: 4242 4242 4242 4242

-- 3. Monitoreo:
--    - Revisa los webhooks en Stripe Dashboard
--    - Revisa los logs de tu aplicación
--    - Ejecuta las queries de monitoreo regularmente

-- 4. Producción:
--    - Cambia a Stripe Live Mode
--    - Actualiza las API keys en .env
--    - La distribuidora necesitará documentos reales para onboarding
--    - El proceso de verificación puede tomar 1-2 días

-- ============================================
-- ¡LISTO! 🎉
-- ============================================
-- Ahora tu sistema está configurado para manejar
-- múltiples equipos de ventas con comisiones automáticas.
