import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../../utils/constants';

function extractIdFromUrl(url: string): string {
  const { pathname } = new URL(url);
  const parts = pathname.split('/');
  return parts[parts.length - 1] || '';
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const id = extractIdFromUrl(req.url);
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications/${id}`, {
    headers: { Authorization: token }
  });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const id = extractIdFromUrl(req.url);
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications/${id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const id = extractIdFromUrl(req.url);
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: token }
  });
  return new NextResponse(null, { status: res.status });
}
