import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../../../utils/constants';

function extractId(url: string): string {
  const { pathname } = new URL(url);
  const parts = pathname.split('/');
  return parts[parts.length - 2] || '';
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const id = extractId(req.url);
  const form = await req.formData();
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications/${id}/upload`, {
    method: 'POST',
    headers: { Authorization: token },
    body: form
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' }
  });
}
