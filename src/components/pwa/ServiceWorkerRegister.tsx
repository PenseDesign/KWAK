'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    console.log('🔍 PWA Debug: Checking service worker support...');
    
    if ('serviceWorker' in navigator) {
      console.log('✅ Service worker is supported');
      
      window.addEventListener('load', () => {
        console.log('🔍 PWA Debug: Attempting to register service worker...');
        
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('✅ ServiceWorker registration successful');
            console.log('📋 Scope:', registration.scope);
            console.log('📋 State:', registration.installing?.state || registration.active?.state);
            
            // Check if service worker is activated
            if (registration.active) {
              console.log('✅ Service worker is active');
            }
            if (registration.installing) {
              console.log('⏳ Service worker is installing');
              registration.installing.addEventListener('statechange', () => {
                console.log('📋 Service worker state changed to:', registration.installing?.state);
              });
            }
            if (registration.waiting) {
              console.log('⏳ Service worker is waiting');
            }
          },
          (err) => {
            console.error('❌ ServiceWorker registration failed:', err);
            console.error('Error details:', err.message, err.name);
          }
        );
      });
    } else {
      console.error('❌ Service worker is NOT supported in this browser');
    }
  }, []);

  return null;
}
