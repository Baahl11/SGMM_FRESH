-- Verificar que el usuario existe
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE id = '86cbe61c-8829-41a2-aa29-81e1f844f83e';
