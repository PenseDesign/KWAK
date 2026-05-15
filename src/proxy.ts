import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Chemins publics — toujours accessibles
    const isPublicPath =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/subscribe') ||
        pathname === '/favicon.ico'

    // Si non connecté et pas public → login
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Si connecté, lire le rôle via la fonction sécurisée (évite la récursion RLS)
    if (user) {
        let role: string | null = null

        try {
            const { data, error } = await supabase.rpc('get_user_role')
            if (!error && data) {
                role = data as string
            }
        } catch (e) {
            console.error('[Proxy] Erreur lecture rôle:', e)
        }

        // Si connecté et sur login/register → rediriger vers le bon espace
        if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
            if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
            if (role === 'agent') return NextResponse.redirect(new URL('/agent', request.url))
            if (role === 'pending_agent') return NextResponse.redirect(new URL('/agent/pending', request.url))
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Protection /admin
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Protection /agent
        if (pathname.startsWith('/agent')) {
            if (role === 'pending_agent' && pathname !== '/agent/pending') {
                return NextResponse.redirect(new URL('/agent/pending', request.url))
            }
            if (role !== 'agent' && role !== 'admin' && role !== 'pending_agent') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }

        // Admin et agent atterrissant sur /dashboard → les envoyer dans leur espace
        if (pathname.startsWith('/dashboard')) {
            if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
            if (role === 'agent') return NextResponse.redirect(new URL('/agent', request.url))
            if (role === 'pending_agent') return NextResponse.redirect(new URL('/agent/pending', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
