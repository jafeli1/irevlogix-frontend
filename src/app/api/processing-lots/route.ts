import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://irevlogix-backend.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/ProcessingLots?${queryString}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    const totalCount = response.headers.get('X-Total-Count');
    
    const nextResponse = NextResponse.json(data);
    if (totalCount) {
      nextResponse.headers.set('X-Total-Count', totalCount);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('Error proxying processing lots request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
