-- VERIFICAR SI JUAN CAMARILLO EXISTE EN AUTH.USERS
SELECT id, email, created_at, 
       raw_user_meta_data->>'nombre' as nombre,
       raw_user_meta_data->>'apellidos' as apellidos
FROM auth.users 
WHERE email = 'asc.admon23@gmail.com';

-- Si el resultado está vacío, Juan NUNCA se registró en la aplicación
-- Solo pagó en Stripe pero no creó cuenta

-- TAMBIÉN BUSCAR POR EL EMAIL DE STRIPE
SELECT id, email, created_at,
       raw_user_meta_data->>'nombre' as nombre,
       raw_user_meta_data->>'apellidos' as apellidos
FROM auth.users 
WHERE email = 'camarillojuan@hotmail.com';
