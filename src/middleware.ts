import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
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

    // 1. Autoriser l'accès public à la Landing Page et au Login/Register
    const isPublicPath = 
        request.nextUrl.pathname === '/' || 
        request.nextUrl.pathname.startsWith('/login') || 
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname === '/favicon.ico'

    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Redirection si déjà connecté (pour les pages publiques Login/Register)
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role
        if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
        if (role === 'agent') return NextResponse.redirect(new URL('/agent', request.url))
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 3. Vérification des rôles pour les routes protégées
    if (user) {
        // Pour les routes sensibles, on vérifie le rôle
        // Note: Idéalement, le rôle devrait être dans user_metadata pour éviter un fetch DB dans le middleware
        if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/agent')) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const role = profile?.role

            if (role === 'pending_agent' && request.nextUrl.pathname !== '/pending') {
                return NextResponse.redirect(new URL('/pending', request.url))
            }

            if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
            if (request.nextUrl.pathname.startsWith('/agent') && role !== 'agent' && role !== 'admin') {
                if (role === 'pending_agent') return NextResponse.redirect(new URL('/pending', request.url))
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
