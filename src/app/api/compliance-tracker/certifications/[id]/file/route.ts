import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../../../utils/constants';

function extractIdFromUrl(url: string): string {
  const { pathname } = new URL(url);
  const parts = pathname.split('/');
  return parts[parts.length - 2] || '';
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const id = extractIdFromUrl(req.url);
  const res = await fetch(`${BACKEND_URL}/api/ComplianceTrackerCertifications/${id}/file`, {
    method: 'DELETE',
    headers: { Authorization: token }
  });
  return new NextResponse(null, { status: res.status });
}
