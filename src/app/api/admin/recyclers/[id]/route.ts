import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://irevlogix-backend.onrender.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${BACKEND_URL}/api/recyclers/${id}`, {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying recycler request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const requestData = {
      ...body,
      userId: 1
    };
    
    const response = await fetch(`${BACKEND_URL}/api/recyclers/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const responseText = await response.text();
    if (!responseText.trim()) {
      return NextResponse.json({ success: true, message: 'Recycler updated successfully' });
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      return NextResponse.json({ success: true, message: responseText });
    }
  } catch (error) {
    console.error('Error proxying recycler update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${BACKEND_URL}/api/recyclers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: 'Recycler deleted successfully' });
  } catch (error) {
    console.error('Error proxying recycler delete request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
