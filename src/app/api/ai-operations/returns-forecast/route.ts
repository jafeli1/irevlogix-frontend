import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://irevlogix-backend.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { search } = new URL(request.url);
    const queryString = search ? search.substring(1) : '';

    const response = await fetch(
      `${BACKEND_URL}/api/AIOperations/returns-forecast${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorBody = contentType.includes('application/json') ? await response.json() : await response.text();
      return NextResponse.json({ error: errorBody }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying returns forecast request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
