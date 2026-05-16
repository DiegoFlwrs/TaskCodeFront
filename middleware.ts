import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

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
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isAuthRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (isTokenValid(token)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/forgot-password/:path*'],
};
