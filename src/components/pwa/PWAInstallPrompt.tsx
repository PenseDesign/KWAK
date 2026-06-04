'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔍 PWA Debug: Checking install prompt support...');
    
    const handler = (e: Event) => {
      console.log('✅ beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      console.log('📋 Install prompt is ready to show');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('📋 Is standalone mode:', isStandalone);
    setIsInstalled(isStandalone);
    if (isStandalone) {
      setShowPrompt(false);
      console.log('✅ App is already installed');
    }

    // Log PWA criteria
    console.log('🔍 PWA Debug: Checking installation criteria...');
    console.log('📋 Protocol:', window.location.protocol);
    console.log('📋 User agent:', navigator.userAgent);
    console.log('📋 Is HTTPS:', window.location.protocol === 'https:');
    console.log('📋 Is localhost:', window.location.hostname === 'localhost');

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    console.log('🔍 PWA Debug: Install button clicked');
    
    if (!deferredPrompt) {
      console.error('❌ No deferred prompt available');
      return;
    }

    console.log('📋 Showing install prompt...');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('❌ User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    console.log('📋 User dismissed the install button');
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setShowPrompt(false);
      console.log('📋 Install prompt was previously dismissed');
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
