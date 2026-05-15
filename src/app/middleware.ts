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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Vérifie la session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Si l'utilisateur n'est pas connecté et essaie d'aller sur une page protégée
  if (!user && (
    request.nextUrl.pathname.startsWith('/(agent)') ||
    request.nextUrl.pathname.startsWith('/(admin)')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Gestion des redirections par rôle (si l'utilisateur est connecté)
  if (user) {
    const role = user.user_metadata?.role // Supposons que tu stockes le rôle dans metadata

    // Empêcher un agent d'aller sur l'admin
    if (request.nextUrl.pathname.startsWith('/(admin)') && role !== 'admin') {
      return NextResponse.redirect(new URL('/(agent)', request.url))
    }

    // Empêcher un client d'aller sur l'interface agent
    if (request.nextUrl.pathname.startsWith('/(agent)') && role !== 'agent') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
