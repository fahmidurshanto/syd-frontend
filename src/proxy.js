import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const isLoggedIn = Boolean(accessToken || refreshToken);

  // If admin is logged in, redirect away from /admin/login to /admin/
  if (isLoggedIn && (pathname === '/admin/login' || pathname === '/admin/login/')) {
    return NextResponse.redirect(new URL('/admin/', request.url));
  }

  return NextResponse.next();
}

// Compatible with both Next.js 16 proxy and middleware naming conventions
export const middleware = proxy;

export const config = {
  matcher: ['/admin/login'],
};
