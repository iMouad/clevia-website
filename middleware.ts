import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Root redirect to default locale
    '/',
    // Locale-prefixed routes
    '/(fr|ar|en)/:path*',
    // All other routes EXCEPT: _next, static files, admin, calendrier, api
    '/((?!_next|_vercel|api|admin|calendrier|.*\\..*).*)',
  ],
}
