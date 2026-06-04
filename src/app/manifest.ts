import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LEPOINCITOYEN',
    short_name: 'LepoinCitoyen',
    description: 'Plateforme intelligente de précollecte des déchets. Connecte les ménages aux agents de collecte pour une ville plus propre.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#16a34a', // green-600
    orientation: 'portrait',
    scope: '/',
    prefer_related_applications: false,
    icons: [
      {
        src: '/logo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
