import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../../utils/constants';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const form = await req.formData();
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerDocuments/upload`, {
    method: 'POST',
    headers: { Authorization: token },
    body: form as any
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}
