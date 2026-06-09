import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({
    hasRedisUrl: !!process.env.REDIS_URL,
    hasKvUrl: !!process.env.KV_URL,
    hasKvRestApiUrl: !!process.env.KV_REST_API_URL,
    redisUrlPreview: process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 15) + '...' : null,
    kvUrlPreview: process.env.KV_URL ? process.env.KV_URL.substring(0, 15) + '...' : null,
  });
}
