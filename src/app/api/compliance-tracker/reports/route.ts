import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../utils/constants';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const url = `${BACKEND_URL}/api/ScheduledReports`;
  const res = await fetch(url, { headers: { Authorization: token } });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const url = `${BACKEND_URL}/api/ScheduledReports`;
  const payload = await req.text();
  const res = await fetch(url, { method: 'POST', headers: { Authorization: token, 'Content-Type': 'application/json' }, body: payload });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}
