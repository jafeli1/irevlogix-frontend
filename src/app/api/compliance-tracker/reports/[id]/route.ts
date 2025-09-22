import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../../utils/constants';

export async function GET(_req: NextRequest, ctx: unknown) {
  const token = _req.headers.get('authorization') || '';
  const params = (ctx as { params: { id: string } }).params;
  const url = `${BACKEND_URL}/api/ScheduledReports/${params.id}`;
  const res = await fetch(url, { headers: { Authorization: token } });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}

export async function PUT(req: NextRequest, ctx: unknown) {
  const token = req.headers.get('authorization') || '';
  const params = (ctx as { params: { id: string } }).params;
  const url = `${BACKEND_URL}/api/ScheduledReports/${params.id}`;
  const payload = await req.text();
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: token, 'Content-Type': 'application/json' }, body: payload });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}

export async function DELETE(req: NextRequest, ctx: unknown) {
  const token = req.headers.get('authorization') || '';
  const params = (ctx as { params: { id: string } }).params;
  const url = `${BACKEND_URL}/api/ScheduledReports/${params.id}`;
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: token } });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}
