import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function POST(req: Request) {
  try {
    const data = await req.json(); // Array of items
    
    // items 배열을 받아서 각각 저장
    const items = Array.isArray(data.items) ? data.items : [data];
    
    const recordsToSave = items.map((item: any, index: number) => ({
      id: Date.now().toString() + '-' + index,
      site: data.site,
      part: data.part,
      receiveDate: data.receiveDate,
      ...item,
      createdAt: new Date().toISOString(),
    }));

    // Redis 리스트(lpush) 대신, 관리를 쉽게 하기 위해 문자열 배열로 관리하거나
    // 각 항목을 lpush 합니다.
    for (const record of recordsToSave) {
      await redis.lpush('material_records', JSON.stringify(record));
    }
    
    return NextResponse.json({ success: true, count: recordsToSave.length });
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
    
    const rawRecords = await redis.lrange('material_records', 0, -1);
    let records = rawRecords.map(r => JSON.parse(r));
    
    // 필터링 적용
    if (site && site !== 'all') records = records.filter(r => r.site === site);
    if (part && part !== 'all') records = records.filter(r => r.part === part);
    if (yearMonth) {
      records = records.filter(r => r.receiveDate && r.receiveDate.startsWith(yearMonth));
    }
    
    // 오래된 순으로 정렬 (lpush는 최신이 먼저 오므로 reverse)
    records.reverse();

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Material record get error:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}
