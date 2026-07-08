import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const PROTECTED_ROUTES = ['/dashboard'];

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const decodePayload = (token: string): { exp?: number } | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenValid = (token: string | undefined): boolean => {
  if (!token) return false;

  const payload = decodePayload(token);
  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

const applySecurityHeaders = (response: NextResponse) => {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const authenticated = isTokenValid(token);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isProtectedRoute && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = authenticated ? '/dashboard' : '/login';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const isKnownRoute = isAuthRoute || isProtectedRoute;
  if (!isKnownRoute) {
    const url = request.nextUrl.clone();
    url.pathname = authenticated ? '/dashboard' : '/login';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
