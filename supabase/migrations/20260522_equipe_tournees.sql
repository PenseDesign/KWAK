-- Migration pour la gestion des tournées en équipe et l'ajout des noms

-- 1. Ajout du nom complet dans les profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Modification de la table tournees pour supporter une équipe, un nom et une zone
ALTER TABLE public.tournees ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE public.tournees ADD COLUMN IF NOT EXISTS zone_cible TEXT;
ALTER TABLE public.tournees ADD COLUMN IF NOT EXISTS agents_ids UUID[] DEFAULT '{}'::UUID[];
ALTER TABLE public.tournees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- On rend l'ancien champ agent_id optionnel (pour ne pas casser l'existant directement)
ALTER TABLE public.tournees ALTER COLUMN agent_id DROP NOT NULL;

-- 3. Optionnel: On peut aussi ajouter une politique de sécurité (RLS) ou un index si besoin, 
-- mais pour l'instant la structure suffit.
