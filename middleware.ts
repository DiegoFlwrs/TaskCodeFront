import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const PROTECTED_ROUTES = ['/dashboard'];

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
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const authenticated = isTokenValid(token);

  // Authenticated users trying to access auth pages → redirect to dashboard
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Unauthenticated users trying to access protected pages → redirect to login
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Root path → redirect to dashboard or login
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = authenticated ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  // Unknown / invalid route → redirect to dashboard or login
  const isKnownRoute = isAuthRoute || isProtectedRoute;
  if (!isKnownRoute) {
    const url = request.nextUrl.clone();
    url.pathname = authenticated ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
