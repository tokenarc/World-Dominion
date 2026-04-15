import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_PATHS = [
  '/auth/telegramVerify',
  '/auth/getSessionUser',
];

const CONVEX_URL = 'https://peaceful-scorpion-529.convex.cloud';
const API_TIMEOUT = 10000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = body.path;
    const args = body.args || {};
    
    if (!path || !ALLOWED_PATHS.includes(path)) {
      return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(`${CONVEX_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args }),
      signal: controller.signal,
    });
    
    const data = await response.json();
    clearTimeout(timeout);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
