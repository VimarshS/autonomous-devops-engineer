import { NextRequest, NextResponse } from 'next/server';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const cookie = req.headers.get('cookie') ?? '';
  const response = await fetch(`${API_URL}/api/v1/security/projects/${params.projectId}/scan`, { method: 'POST', headers: { Cookie: cookie } });
  return NextResponse.json(await response.json(), { status: response.status });
}