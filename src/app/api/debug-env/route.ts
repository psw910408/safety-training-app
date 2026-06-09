import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const url = process.env.REDIS_URL || '';
  let hostname = 'none';
  try { hostname = new URL(url).hostname; } catch(e) {}
  return NextResponse.json({ hostname });
}
