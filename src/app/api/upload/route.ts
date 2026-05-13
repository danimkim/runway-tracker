import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseTossBankPDF } from '@/lib/tossbank/parser';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseTossBankPDF(buffer);

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Failed to parse PDF' }, { status: 422 });
  }

  const approved = result.transactions.filter((t) => t.status === 'Approved');
  return NextResponse.json({ transactions: approved });
}
