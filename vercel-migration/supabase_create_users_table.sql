-- ============================================
-- CREAR TABLA users SI NO EXISTE
-- ============================================
-- Esta tabla almacena información de usuarios del sistema
-- Se sincroniza con auth.users de Supabase

-- Crear tabla users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'medico' CHECK (role IN ('admin', 'medico', 'recepcionista', 'paciente')),
  phone TEXT,
  avatar_url TEXT,
  trial_ends_at TIMESTAMPTZ,
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver su propia información
CREATE POLICY "Users can view own profile" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Los usuarios pueden actualizar su propia información
CREATE POLICY "Users can update own profile" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Permitir INSERT para service_role (para el callback de auth)
CREATE POLICY "Service role can insert users" 
  ON users 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Los admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" 
  ON users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comentarios en la tabla
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema AgendaMedPro';
COMMENT ON COLUMN users.id IS 'UUID del usuario, referencia a auth.users';
COMMENT ON COLUMN users.email IS 'Email del usuario (único)';
COMMENT ON COLUMN users.name IS 'Nombre completo del usuario';
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin, medico, recepcionista, paciente';
COMMENT ON COLUMN users.trial_ends_at IS 'Fecha de expiración del trial (si aplica)';
COMMENT ON COLUMN users.subscription_id IS 'ID de suscripción de Stripe';

-- ============================================
-- MIGRAR USUARIOS EXISTENTES DE auth.users
-- ============================================
-- Insertar usuarios que existen en auth.users pero no en users
INSERT INTO users (id, email, name, role, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'medico' as role,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar cuántos usuarios se crearon
SELECT COUNT(*) as total_users FROM users;

-- Ver los usuarios creados
SELECT id, email, name, role, trial_ends_at, created_at 
FROM users 
ORDER BY created_at DESC;
