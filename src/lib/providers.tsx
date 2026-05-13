'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
    // On initialise le QueryClient avec des paramètres optimisés pour le terrain
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // Les données sont considérées "fraîches" pendant 1 min
                        retry: 3, // Réessaye 3 fois en cas d'échec réseau (crucial pour les agents)
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
