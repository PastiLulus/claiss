import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * API Authentication Middleware
 * 
 * Protects all API routes with simple API key authentication.
 * Set API_SECRET_KEY in your environment variables.
 * 
 * Usage:
 * curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/...
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (pathname.startsWith('/api/')) {
    const apiKey = process.env.API_SECRET_KEY;

    // If no API key is configured, allow all requests (development mode)
    if (!apiKey) {
      console.warn('[AUTH] API_SECRET_KEY not configured - authentication disabled!');
      return NextResponse.next();
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');

    // Check for valid bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY'
        },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token
    if (token !== apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid API key'
        },
        { status: 401 }
      );
    }

    // Authentication successful
    console.log(`[AUTH] ✅ Authenticated request to ${pathname}`);
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: '/api/:path*',
};