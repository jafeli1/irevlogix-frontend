import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../utils/constants';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: token }
  });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json', 'X-Total-Count': res.headers.get('X-Total-Count') || '' } });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}
