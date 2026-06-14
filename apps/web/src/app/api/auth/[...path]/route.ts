import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/auth', '');
  // Include /v1 version in the URL to match NestJS versioning
  const url = `${API_URL}/api/v1/auth${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key !== 'host') {
      headers.set(key, value);
    }
  });

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : undefined,
    });

    const responseBody = await response.text();

    // Pass ALL headers through including set-cookie
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;