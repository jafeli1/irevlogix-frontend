import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://irevlogix-backend.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, email, company, message } = body;
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        company: company || '',
        message,
        recipient: 'support@irevlogix.com'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending contact form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
