import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookie = req.headers.get('cookie') ?? '';

  const response = await fetch(`${API_URL}/api/v1/projects/${params.id}`, {
    headers: { Cookie: cookie },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookie = req.headers.get('cookie') ?? '';
  const body = await req.text();

  const response = await fetch(`${API_URL}/api/v1/projects/${params.id}`, {
    method: 'PATCH',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookie = req.headers.get('cookie') ?? '';

  const response = await fetch(`${API_URL}/api/v1/projects/${params.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}