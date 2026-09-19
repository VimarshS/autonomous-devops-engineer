import { NextRequest, NextResponse } from 'next/server';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const cookie = req.headers.get('cookie') ?? '';
  const response = await fetch(`${API_URL}/api/v1/artifacts/projects/${params.projectId}`, { headers: { Cookie: cookie } });
  return NextResponse.json(await response.json(), { status: response.status });
}