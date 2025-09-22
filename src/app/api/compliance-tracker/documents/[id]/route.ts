import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../../utils/constants';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const token = _req.headers.get('authorization') || '';
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerDocuments/${params.id}`, {
    headers: { Authorization: token }
  });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization') || '';
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerDocuments/${params.id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization') || '';
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerDocuments/${params.id}`, {
    method: 'DELETE',
    headers: { Authorization: token }
  });
  return new NextResponse(null, { status: res.status });
}
