export type Profile = {
  id: string
  phone: string
  role: 'client' | 'agent' | 'admin' | 'pending_agent'
  repere_textuel: string
  photo_facade_url: string
  coords_gps: { lat: number; lng: number }
  full_name?: string
  quartier?: string
}

export type Abonnement = {
  client_id: string
  type_forfait: 'hebdo' | 'mensuel'
  status: 'actif' | 'suspendu' | 'en_retard'
  date_expiration: string
}

export type Tournee = {
  id: string
  agent_id?: string // Deprecated
  agents_ids: string[]
  nom: string
  zone_cible: string
  status: 'active' | 'inactive'
  date?: string // Deprecated
  statut?: 'prete' | 'en_cours' | 'terminee' // Deprecated
}

export type Passage = {
  id: string
  tournee_id: string
  client_id: string
  status: 'valide' | 'absent' | 'impossible' | 'en_attente'
  photo_preuve_url?: string
  heure_passage?: string
}

// Vue "rejointe" pour faciliter le typage du front Agent
export type ClientMission = Profile & {
  passage_id: string
  passage_status: Passage['status']
}

export type PaymentTransaction = {
  id: string
  client_id: string
  demande_abonnement_id?: string
  phone_number: string
  operator: 'mtn' | 'orange'
  amount: number
  currency: string
  reference: string
  campay_transaction_id?: string
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled'
  error_message?: string
  created_at: string
  updated_at: string
  completed_at?: string
}
