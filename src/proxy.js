import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const isLoggedIn = Boolean(accessToken || refreshToken);

  // If user has NO tokens and is trying to access protected /admin routes (except /admin/login)
  if (!isLoggedIn && pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/login/') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // If admin is logged in (has accessToken or refreshToken), redirect away from /admin/login to /admin
  if (isLoggedIn && (pathname === '/admin/login' || pathname === '/admin/login/')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If accessToken is expired/missing but valid refreshToken is present on /admin routes,
  // rotate token server-side via backend POST /api/v1/admins/refresh-token so page receives new cookies immediately
  if (!accessToken && refreshToken && pathname.startsWith('/admin')) {
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
      const refreshRes = await fetch(`${apiUrl}/api/v1/admins/refresh-token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Cookie: `refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const response = NextResponse.next();

        // Forward rotated Set-Cookie headers from backend response
        const setCookies = refreshRes.headers.getSetCookie?.() || [];
        if (setCookies.length > 0) {
          setCookies.forEach((cookieStr) => {
            response.headers.append('Set-Cookie', cookieStr);
          });
        } else if (data.accessToken) {
          response.cookies.set('accessToken', data.accessToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
          });
          if (data.refreshToken) {
            response.cookies.set('refreshToken', data.refreshToken, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
            });
          }
        }

        return response;
      }
    } catch (err) {
      console.error('Proxy token refresh error:', err);
    }
  }

  return NextResponse.next();
}

// Compatible with both Next.js 16 proxy and middleware naming conventions
export const middleware = proxy;

export const config = {
  matcher: ['/admin/:path*'],
};
