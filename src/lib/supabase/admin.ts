import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la Service Role Key — bypass les politiques RLS.
 * À utiliser UNIQUEMENT côté serveur pour des opérations privilégiées
 * (ex: retrouver l'email d'un utilisateur à partir de son numéro de téléphone
 * lors de la connexion, avant que la session soit établie).
 */
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Variables SUPABASE manquantes : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
