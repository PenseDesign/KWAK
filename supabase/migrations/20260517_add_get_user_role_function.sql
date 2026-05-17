-- ================================================================
-- Fonction RPC get_user_role manquante
-- Cette fonction est utilisée par le middleware et les actions
-- pour lire le rôle de l'utilisateur connecté
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$;
