export type Profile = {
  id: string
  phone: string
  role: 'client' | 'agent' | 'admin' | 'pending_agent'
  repere_textuel: string
  photo_facade_url: string
  coords_gps: { lat: number; lng: number }
}

export type Abonnement = {
  client_id: string
  type_forfait: 'hebdo' | 'mensuel'
  status: 'actif' | 'suspendu' | 'en_retard'
  date_expiration: string
}

export type Tournee = {
  id: string
  agent_id: string
  date: string
  statut: 'prete' | 'en_cours' | 'terminee'
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
