-- Run this in Supabase SQL Editor to create your admin profile

INSERT INTO user_profiles (user_id, name, email, role, plan_type)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  'admin',
  'premium'
FROM auth.users
WHERE email = 'guillermo.melgarejo.m@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin'; -- Si ya existe, actualiza a admin
