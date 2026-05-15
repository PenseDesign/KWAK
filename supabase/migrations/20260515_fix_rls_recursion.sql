-- ================================================================
-- KWAK — Correction RLS + Fonction get_user_role()
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- 1. Fonction SECURITY DEFINER pour lire le rôle SANS déclencher les RLS
--    (contourne la récursion infinie des policies sur la table profiles)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Donner accès à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;

-- ----------------------------------------------------------------
-- 2. Corriger la policy récursive sur la table profiles
-- ----------------------------------------------------------------

-- Supprimer l'ancienne policy problématique (elle fait une sous-requête sur profiles)
DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;

-- Nouvelle policy: utilise la fonction SECURITY DEFINER (pas de récursion)
CREATE POLICY "admin_full_access_profiles"
  ON profiles FOR ALL
  USING (public.get_user_role() = 'admin');

-- ----------------------------------------------------------------
-- 3. Corriger toutes les autres policies admin (même logique)
-- ----------------------------------------------------------------

-- abonnements
DROP POLICY IF EXISTS "admin_full_access_abonnements" ON abonnements;
CREATE POLICY "admin_full_access_abonnements"
  ON abonnements FOR ALL
  USING (public.get_user_role() = 'admin');

-- tournees
DROP POLICY IF EXISTS "admin_full_access_tournees" ON tournees;
CREATE POLICY "admin_full_access_tournees"
  ON tournees FOR ALL
  USING (public.get_user_role() = 'admin');

-- passages
DROP POLICY IF EXISTS "admin_full_access_passages" ON passages;
CREATE POLICY "admin_full_access_passages"
  ON passages FOR ALL
  USING (public.get_user_role() = 'admin');

-- signalements
DROP POLICY IF EXISTS "admin_full_access_signalements" ON signalements;
CREATE POLICY "admin_full_access_signalements"
  ON signalements FOR ALL
  USING (public.get_user_role() = 'admin');

-- demandes_abonnement
DROP POLICY IF EXISTS "admin_full_access_demandes" ON demandes_abonnement;
CREATE POLICY "admin_full_access_demandes"
  ON demandes_abonnement FOR ALL
  USING (public.get_user_role() = 'admin');

-- ----------------------------------------------------------------
-- 4. CRÉER LE COMPTE ADMIN
-- Remplacez UUID_DU_COMPTE ci-dessous par le vrai UUID affiché dans
-- Authentication > Users de votre dashboard Supabase
-- ----------------------------------------------------------------
-- UPDATE profiles SET role = 'admin' WHERE id = 'UUID_DU_COMPTE';

-- OU, si vous connaissez l'email :
-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'groupelpcinfo@gmail.com');
