import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies (if using cookie storage) or check localStorage via client-side
  // Note: Since we're using localStorage via Zustand, we can't access it in middleware
  // We'll handle auth checks client-side in the layout components

  // For now, just allow all routes
  // Client-side auth guards will be implemented in layout components
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
