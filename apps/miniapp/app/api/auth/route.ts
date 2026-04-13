import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_PATHS = [
  '/auth/telegramVerify',
  '/auth/getSessionUser',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = body.path;
    const args = body.args || {};
    
    if (!path || !ALLOWED_PATHS.includes(path)) {
      return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
    }
    
    const response = await fetch(`https://peaceful-scorpion-529.convex.site${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args }),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}