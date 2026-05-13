'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function NetworkAlert() {
  const [isOnline, setIsOnline] = useState(true)
  const [hasShownOnline, setHasShownOnline] = useState(true)

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine)
    
    if (!navigator.onLine) {
      setHasShownOnline(false)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => setHasShownOnline(true), 3000) // Hide success message after 3s
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setHasShownOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && hasShownOnline) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium text-white shadow-md transition-colors duration-300 flex items-center justify-center gap-2 ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Connexion rétablie. Vos données seront synchronisées.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Vous êtes hors ligne. Les données sont sauvegardées localement.</span>
        </>
      )}
    </div>
  )
}
