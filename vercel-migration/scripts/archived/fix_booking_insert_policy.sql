-- ============================================
-- FIX: Permitir INSERT en public_bookings desde API pública
-- ============================================

-- Agregar policy para permitir INSERT sin autenticación (para bookings públicos)
CREATE POLICY "Anyone can create bookings"
  ON public_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verificar policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'public_bookings';
