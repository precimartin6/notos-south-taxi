import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const r = await db.getById(id);
  if (!r) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({
    id: r.id,
    status: r.status,
    totalEUR: r.totalEUR,
    depositEUR: r.depositEUR,
    remainderEUR: r.remainderEUR
  });
}
