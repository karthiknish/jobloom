import { NextRequest, NextResponse } from 'next/server';
import { getServerRateLimitStatus, getEndpointFromPath } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  try {
    // Get client IP from various headers
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';

    // Get endpoint from query parameter or use general
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'general';

    const rateLimitStatus = getServerRateLimitStatus(clientIP, endpoint);

    return NextResponse.json({
      endpoint,
      ...rateLimitStatus,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
