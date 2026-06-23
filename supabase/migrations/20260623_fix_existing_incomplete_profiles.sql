-- ================================================================
-- KWAK — Correction : profils existants avec données manquantes
-- Exécuter dans Supabase SQL Editor pour réparer les comptes
-- comme khlodyafokam@gmail.com (créé mais sans full_name/phone)
-- ================================================================

-- 1. Vérifier le profil de cet utilisateur précis
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.phone,
  p.email,
  p.quartier,
  p.created_at,
  u.email AS auth_email,
  u.raw_user_meta_data
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'khlodyafokam@gmail.com';

-- 2. Synchroniser email depuis auth.users pour tous les profils sans email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 3. Synchroniser full_name depuis les metadata (pour les inscrits via le formulaire)
UPDATE public.profiles p
SET full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id
  AND (p.full_name IS NULL OR p.full_name = '')
  AND u.raw_user_meta_data->>'full_name' IS NOT NULL
  AND u.raw_user_meta_data->>'full_name' != '';

-- 4. Vérifier le résultat final
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.phone,
  p.email,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 20;
