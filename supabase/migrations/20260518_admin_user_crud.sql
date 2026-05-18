-- ================================================================
-- KWAK — Migration Admin User CRUD Functions
-- ================================================================

-- 1. Fonction RPC pour lister tous les utilisateurs avec e-mails (réservé aux admins)
CREATE OR REPLACE FUNCTION public.get_users_admin()
RETURNS TABLE (
  id UUID,
  role TEXT,
  phone TEXT,
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
  -- Vérifier si le demandeur est admin
  SELECT public.profiles.role INTO caller_role FROM public.profiles WHERE public.profiles.id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can list all users with emails';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.phone,
    p.repere_textuel,
    p.coords_gps,
    p.photo_facade_url,
    p.created_at,
    u.email::TEXT
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. Fonction RPC pour supprimer un utilisateur par l'admin (réservé aux admins)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Vérifier si le demandeur est admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Empêcher l'auto-suppression
  IF auth.uid() = user_id THEN
    RAISE EXCEPTION 'Admins cannot delete themselves';
  END IF;

  -- Supprimer dans auth.users (cascades vers public.profiles, etc.)
  DELETE FROM auth.users WHERE id = user_id;
  RETURN TRUE;
END;
$$;

-- 3. Fonction RPC pour créer un utilisateur par l'admin (réservé aux admins)
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
  user_email TEXT,
  user_password TEXT,
  user_phone TEXT,
  user_role TEXT,
  user_repere_textuel TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  new_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Vérifier si le demandeur est admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  -- Chiffrer le mot de passe avec bcrypt
  encrypted_pw := crypt(user_password, gen_salt('bf', 10));

  -- Créer le compte dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    encrypted_pw,
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Mettre à jour les informations du profil public
  UPDATE public.profiles
  SET 
    role = user_role,
    phone = user_phone,
    repere_textuel = user_repere_textuel
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$;
