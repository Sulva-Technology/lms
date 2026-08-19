import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessRolePath, getRequiredRoleForPath, getRoleRedirectPath } from '@/lib/auth/roles'
import { resolveAccess } from '@/lib/auth/membership-access'
import type { SupabaseLike } from '@/lib/auth/membership'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseTenantHost } from '@/lib/tenant/host'
import { resolveTenant } from '@/lib/tenant/resolve'
import { env } from '@/lib/env'

const PUBLIC_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/invite',
  '/verify',
  '/design-system',
  '/docs',
  '/unauthorized',
  '/api/',
  '/certificates',
  '/school-not-found',
  '/school-unavailable',
]

const isPublicPath = (pathname: string) =>
  pathname === '/' || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const rewriteTo = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  return NextResponse.rewrite(url)
}

const setOrDelete = (headers: Headers, key: string, value: string | null) => {
  if (value) headers.set(key, value)
  else headers.delete(key)
}

export const updateSession = async (request: NextRequest) => {
  try {
    const { pathname } = request.nextUrl
    const host = request.headers.get('host')
    const tenantHost = parseTenantHost(host, env.NEXT_PUBLIC_ROOT_DOMAIN)

    if (tenantHost.kind === 'unknown') {
      return rewriteTo(request, '/school-not-found')
    }

    let tenantId: string | null = null
    let tenantSubdomain: string | null = null
    let tenantName: string | null = null
    let tenantPrimary: string | null = null
    let tenantSecondary: string | null = null

    if (tenantHost.kind === 'tenant') {
      const lookup = await resolveTenant(tenantHost.subdomain)
      if (!lookup.ok) {
        return rewriteTo(request, '/school-unavailable')
      }
      if (!lookup.tenant) {
        return rewriteTo(request, '/school-not-found')
      }
      if (lookup.tenant.status === 'suspended' || lookup.tenant.status === 'archived') {
        return rewriteTo(request, '/school-unavailable')
      }
      tenantId = lookup.tenant.id
      tenantSubdomain = lookup.tenant.subdomain
      tenantName = lookup.tenant.name
      tenantPrimary = lookup.tenant.primary_color
      tenantSecondary = lookup.tenant.secondary_color

      // Platform administration is not reachable from a school host.
      if (pathname.startsWith('/superadmin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        url.search = ''
        return NextResponse.redirect(url)
      }
    }

    const requestHeaders = new Headers(request.headers)
    if (tenantId && tenantSubdomain) {
      requestHeaders.set('x-university-id', tenantId)
      requestHeaders.set('x-university-subdomain', tenantSubdomain)
      // Branding travels with the tenant headers so the root layout can paint
      // the school's colours without a second lookup of the row we just read.
      // Percent-encoded: a school name is free text and headers reject control
      // characters and anything outside latin-1.
      setOrDelete(requestHeaders, 'x-university-name', tenantName && encodeURIComponent(tenantName))
      setOrDelete(requestHeaders, 'x-university-primary', tenantPrimary)
      setOrDelete(requestHeaders, 'x-university-secondary', tenantSecondary)
    } else {
      // A forged header on a root-domain request must never look like a tenant.
      requestHeaders.delete('x-university-id')
      requestHeaders.delete('x-university-subdomain')
      requestHeaders.delete('x-university-name')
      requestHeaders.delete('x-university-primary')
      requestHeaders.delete('x-university-secondary')
    }

    if (isPublicPath(pathname)) {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Unauthenticated users cannot access protected routes.
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    const adminClient = createAdminClient()
    const access = await resolveAccess(adminClient as unknown as SupabaseLike, user.id, tenantId)

    // Authenticated invited users without a profile must finish onboarding.
    if (!access.hasProfile && !pathname.startsWith('/onboarding') && !pathname.startsWith('/reset-password')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/profile'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // An account with no standing at this school must not be usable on its
    // host. Cookies carry no Domain attribute, so signing out here never
    // touches the person's session at another school.
    if (access.hasProfile && tenantId && !access.role) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = '?error=wrong-school'
      return NextResponse.redirect(url)
    }

    // Completed users should not re-enter onboarding.
    if (access.hasProfile && pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(access.role)
      url.search = ''
      return NextResponse.redirect(url)
    }

    const requiredRole = getRequiredRoleForPath(pathname)
    if (access.role && requiredRole && !canAccessRolePath(access.role, requiredRole)) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(access.role)
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
