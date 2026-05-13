import { ClientMission } from '@/lib/types/database'

/**
 * Algorithme de tri des maisons.
 * Pour le moment, il effectue un tri basique (par exemple, ordre d'identifiant ou un champ d'index simulé).
 * Dans une version de production, cet algorithme appellerait une API de routing (ex: Mapbox Optimization API)
 * pour résoudre le problème du voyageur de commerce (TSP).
 */
export function optimizeRoute(missions: ClientMission[]): ClientMission[] {
  if (!missions || missions.length === 0) return []

  // Simuler un tri intelligent (ici on se base juste arbitrairement sur les coordonnées ou l'ID)
  return [...missions].sort((a, b) => {
    // Si on avait un ordre prédéfini dans la BDD, on l'utiliserait ici.
    // Pour l'exemple, on trie par ID pour garantir un ordre constant.
    return a.id.localeCompare(b.id)
  })
}
