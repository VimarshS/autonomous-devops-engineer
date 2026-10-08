import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const cookie = req.headers.get('cookie') ?? '';
  const body = await req.text();

  const response = await fetch(
    `${API_URL}/api/v1/ai/projects/${params.projectId}/ask`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body,
    },
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}