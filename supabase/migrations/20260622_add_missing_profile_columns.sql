-- ================================================================
-- KWAK — Correction : colonnes manquantes dans la table profiles
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- 1. Ajouter les colonnes manquantes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS quartier TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Recréer la fonction get_users_admin pour s'assurer qu'elle retourne bien ces champs
-- (déjà faite en 20260518 mais au cas où la table ne les avait pas encore)
CREATE OR REPLACE FUNCTION public.get_users_admin()
RETURNS TABLE (
  id UUID,
  role TEXT,
  phone TEXT,
  full_name TEXT,
  quartier TEXT,
  repere_textuel TEXT,
  coords_gps JSONB,
  photo_facade_url TEXT,
  created_at TIMESTAMPTZ,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT public.profiles.role INTO caller_role FROM public.profiles WHERE public.profiles.id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can list all users with emails';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.phone,
    p.full_name,
    p.quartier,
    p.repere_textuel,
    p.coords_gps,
    p.photo_facade_url,
    p.created_at,
    -- Priorité : email stocké dans profiles, sinon fallback vers auth.users
    COALESCE(p.email, u.email::TEXT) AS email
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. Corriger le trigger handle_new_user pour capturer full_name et email depuis raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$;

-- 4. Rétroactivement remplir email depuis auth.users pour les profils existants sans email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');
