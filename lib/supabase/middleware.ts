import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { AuthRole } from '@/types/auth'
import { canAccessRolePath, getRequiredRoleForPath, getRoleRedirectPath } from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'

export const updateSession = async (request: NextRequest) => {
  try {
    const { pathname } = request.nextUrl
    const isPublicRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/invite') ||
      pathname.startsWith('/verify') ||
      pathname.startsWith('/design-system') ||
      pathname.startsWith('/docs') ||
      pathname.startsWith('/unauthorized') ||
      pathname.startsWith('/api/') ||
      pathname === '/'

    if (isPublicRoute) {
      return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
      request,
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
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Check auth status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1. Unauthenticated users cannot access protected routes
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    if (!user) {
      return supabaseResponse
    }

    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Middleware profile fetch error:', profileError)
      // We don't redirect to login here because the user is technically authenticated
      // but something is wrong with the DB. Let the individual pages handle it or 
      // proceed if it's a public route.
    }

    // 2. Authenticated invited users without a profile must finish onboarding.
    if (!profile && !pathname.startsWith('/onboarding') && !pathname.startsWith('/reset-password')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/profile'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // 3. Authenticated users cannot access login page.
    if (pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = profile ? getRoleRedirectPath(profile.role as AuthRole) : '/onboarding/profile'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // 4. Completed users should not re-enter onboarding.
    if (profile && pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(profile.role as AuthRole)
      url.search = ''
      return NextResponse.redirect(url)
    }

    const requiredRole = getRequiredRoleForPath(pathname)
    if (profile && requiredRole && !canAccessRolePath(profile.role as AuthRole, requiredRole)) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(profile.role as AuthRole)
      url.search = ''
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (e) {
    console.error('Middleware supbase client creation error', e)
    return NextResponse.next({
      request,
    })
  }
}
