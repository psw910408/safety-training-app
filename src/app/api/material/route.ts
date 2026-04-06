import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { site, part, receiveDate, items } = data;
    
    // items 배열 전체를 하나의 배치(batch)로 묶어서 저장합니다.
    const batchRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      site,
      part,
      receiveDate,
      items // [{ id, materialName, specification, quantity, supplier, photoBase64 }]
    };
    
    await redis.lpush('material_records', JSON.stringify(batchRecord));
    
    return NextResponse.json({ success: true, batchId: batchRecord.id });
  } catch (error) {
    console.error('Material record post error:', error);
    return NextResponse.json({ error: 'Failed to insert record' }, { status: 500 });
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
    
    // 과거(단일 아이템) 호환성 보정을 위해 items가 없는 경우 강제로 items 배열 스키마로 래핑
    records = records.map(r => {
      if (!r.items) {
        return {
          id: r.id,
          site: r.site,
          part: r.part,
          receiveDate: r.receiveDate,
          items: [{
            id: r.id + '_sub',
            materialName: r.materialName,
            specification: r.specification,
            quantity: r.quantity,
            supplier: r.supplier,
            inspectionResult: r.inspectionResult,
            photoBase64: r.photoBase64
          }]
        };
      }
      return r;
    });

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

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const rawRecords = await redis.lrange('material_records', 0, -1);
    
    let targetIndex = -1;
    for (let i = 0; i < rawRecords.length; i++) {
       const record = JSON.parse(rawRecords[i]);
       if (record.id === data.id) {
          targetIndex = i;
          // 업데이트할 데이터 병합
          const updatedRecord = { ...record, ...data };
          await redis.lset('material_records', i, JSON.stringify(updatedRecord));
          break;
       }
    }
    
    if (targetIndex === -1) {
       return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Material record update error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    const rawRecords = await redis.lrange('material_records', 0, -1);
    let targetRecord = null;
    
    for (const raw of rawRecords) {
       const record = JSON.parse(raw);
       if (record.id === id) {
          targetRecord = raw;
          break;
       }
    }
    
    if (targetRecord) {
       await redis.lrem('material_records', 1, targetRecord);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Material record delete error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}

