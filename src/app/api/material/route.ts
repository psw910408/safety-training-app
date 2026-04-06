import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const id = Date.now().toString();
    const materialRecord = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };

    // Vercel KV 리스트에 저장
    await kv.lpush('material_records', materialRecord);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Material record save error:', error);
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get('site');
    const part = searchParams.get('part');
    const yearMonth = searchParams.get('month'); // YYYY-MM
    
    let records: any[] = await kv.lrange('material_records', 0, -1);
    
    // 필터링 적용
    if (site && site !== 'all') records = records.filter(r => r.site === site);
    if (part && part !== 'all') records = records.filter(r => r.part === part);
    if (yearMonth) {
      records = records.filter(r => r.receiveDate && r.receiveDate.startsWith(yearMonth));
    }
    
    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Material record get error:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}
