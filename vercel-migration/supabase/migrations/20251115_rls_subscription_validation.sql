-- =========================================================
-- BLOQUEAR ACCESO A DATOS SI TRIAL VENCIDO SIN PAGO
-- =========================================================

-- Función helper para verificar si un usuario tiene acceso válido
CREATE OR REPLACE FUNCTION user_has_valid_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = user_uuid
    AND (
      -- Tiene suscripción pagada en Stripe
      stripe_subscription_id IS NOT NULL
      -- O trial aún activo
      OR (status = 'trialing' AND trial_end > NOW())
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- =========================================================
-- ACTUALIZAR POLÍTICAS RLS EN TABLAS PRINCIPALES
-- =========================================================

-- PATIENTS: Solo si tiene suscripción válida
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own patients" 
  ON patients FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
CREATE POLICY "Users can insert own patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update own patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own patients" ON patients;
CREATE POLICY "Users can delete own patients"
  ON patients FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

-- APPOINTMENTS: Solo si tiene suscripción válida
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

-- TREATMENTS: Solo si tiene suscripción válida
DROP POLICY IF EXISTS "Users can view own treatments" ON treatments;
CREATE POLICY "Users can view own treatments"
  ON treatments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own treatments" ON treatments;
CREATE POLICY "Users can insert own treatments"
  ON treatments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND user_has_valid_subscription(auth.uid())
  );

-- =========================================================
-- NOTA: SUBSCRIPTIONS TABLE NO DEBE TENER ESTA RESTRICCIÓN
-- Los usuarios DEBEN poder ver su suscripción vencida
-- para mostrarles el mensaje de "Renovar suscripción"
-- =========================================================

COMMENT ON FUNCTION user_has_valid_subscription IS 
'Verifica si un usuario tiene acceso válido: 
1. Suscripción pagada en Stripe (stripe_subscription_id presente)
2. O trial activo (trial_end en el futuro)
Sin esto, no puede acceder a sus datos.';
