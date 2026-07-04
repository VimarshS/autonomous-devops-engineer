import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? '';

  const response = await fetch(`${API_URL}/api/v1/github/repos`, {
    headers: { Cookie: cookie },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}