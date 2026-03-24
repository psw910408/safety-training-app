import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateTrainings } from '@/lib/calc';

export async function GET(request: NextRequest) {
  try {
    const site = request.nextUrl.searchParams.get('site') as 'jongno' | 'samhwa' || 'jongno';
    const db = await getDb(site);
    const workers = await db.all('SELECT * FROM workers ORDER BY id DESC');
    return NextResponse.json({ success: true, data: workers });
  } catch (error) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, department, hireDate, isNightWorker, site } = await request.json();
    const targetSite = (site as 'jongno' | 'samhwa') || 'jongno';
    const db = await getDb(targetSite);
    
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 11) {
      formattedPhone = `${formattedPhone.slice(0, 3)}-${formattedPhone.slice(3, 7)}-${formattedPhone.slice(7)}`;
    }

    const t = calculateTrainings(hireDate, isNightWorker, department || '시설/관리');

    const result = await db.run(
      `INSERT INTO workers (
        name, phone, department, hireDate, isNightWorker, trainingHire, 
        trainingPressure, trainingBoiler, trainingFire, 
        trainingElectric, trainingConfined, trainingMSDS, nextTrainingMSDS,
        healthCheckPre, healthCheckPost, healthCheckRegular
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      name, formattedPhone, department || '시설/관리', hireDate, isNightWorker ? 1 : 0, t.trainingHire,
      t.trainingPressure, t.trainingBoiler, t.trainingFire,
      t.trainingElectric, t.trainingConfined, t.trainingMSDS, t.nextTrainingMSDS,
      t.healthCheckPre, t.healthCheckPost, t.healthCheckRegular
    );
    
    return NextResponse.json({ success: true, id: result.lastID });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json({ error: '이미 등록된 번호입니다.' }, { status: 400 });
    }
    return NextResponse.json({ error: '등록 실패 -> ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const site = searchParams.get('site') as 'jongno' | 'samhwa' || 'jongno';
    const db = await getDb(site);
    await db.run('DELETE FROM workers WHERE id = ?', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
