'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    if (isStandalone) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setShowPrompt(false);
    }
  }, []);

  if (isInstalled) return null;
  if (!showPrompt || !deferredPrompt) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleInstall}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-2xl p-4 z-50 flex items-center justify-center gap-2 transition-all hover:scale-110 animate-bounce-slow"
        title="Installer l'application"
      >
        <Download className="w-6 h-6" />
        <span className="font-semibold text-sm hidden sm:inline">Installer</span>
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="fixed bottom-6 right-20 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg p-3 z-50 flex items-center justify-center transition-all hover:scale-110"
        title="Fermer"
      >
        <X className="w-5 h-5" />
      </button>
    </>
  );
}
