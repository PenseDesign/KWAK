'use client'

import { useState, useEffect } from 'react'
import localforage from 'localforage'
import { syncOfflineData } from '@/app/actions'
import { ClientMission, Passage } from '@/lib/types/database'

type OfflinePassage = {
  id: string
  status: Passage['status']
  photo?: string
}

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState<OfflinePassage[]>([])
  const [cachedTournee, setCachedTournee] = useState<ClientMission[]>([])

  useEffect(() => {
    // Initialisation
    const init = async () => {
      const queue = await localforage.getItem<OfflinePassage[]>('offlineQueue')
      if (queue) setOfflineQueue(queue)
      
      const tournee = await localforage.getItem<ClientMission[]>('cachedTournee')
      if (tournee) setCachedTournee(tournee)
    }
    init()
  }, [])

  const saveTournee = async (missions: ClientMission[]) => {
    await localforage.setItem('cachedTournee', missions)
    setCachedTournee(missions)
  }

  const queuePassageValidation = async (id: string, status: Passage['status'], photoBase64?: string) => {
    const newItem: OfflinePassage = { id, status, photo: photoBase64 }
    const updatedQueue = [...offlineQueue, newItem]
    await localforage.setItem('offlineQueue', updatedQueue)
    setOfflineQueue(updatedQueue)

    // Mettre à jour le cache local pour la vue
    const updatedTournee = cachedTournee.map(m => 
      m.passage_id === id ? { ...m, passage_status: status } : m
    )
    await saveTournee(updatedTournee)

    // Tenter de synchroniser immédiatement
    triggerSync(updatedQueue)
  }

  const triggerSync = async (queueToSync = offlineQueue) => {
    if (!navigator.onLine || queueToSync.length === 0 || isSyncing) return

    setIsSyncing(true)
    try {
      // Synchronisation par lot (batch)
      const res = await syncOfflineData(queueToSync)
      if (res.success) {
        // Vider la file d'attente
        await localforage.setItem('offlineQueue', [])
        setOfflineQueue([])
      }
    } catch (e) {
      console.error('Erreur lors de la synchronisation:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  // Écoute du retour de la connexion
  useEffect(() => {
    const handleOnline = () => triggerSync()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [offlineQueue, isSyncing])

  return {
    cachedTournee,
    saveTournee,
    queuePassageValidation,
    offlineQueueCount: offlineQueue.length,
    isSyncing,
    triggerSync
  }
}
