import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let phone = searchParams.get('phone');
  const site = searchParams.get('site') as 'jongno' | 'samhwa';

  if (!phone) {
    return NextResponse.json({ error: '휴대폰 번호를 입력해주세요.' }, { status: 400 });
  }

  if (!site || (site !== 'jongno' && site !== 'samhwa')) {
    return NextResponse.json({ error: '올바른 현장을 선택해주세요.' }, { status: 400 });
  }

  // Normalize phone number (allow both with or without hyphens)
  phone = phone.replace(/[^0-9]/g, '');
  if (phone.length === 11) {
    phone = `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  }

  try {
    const db = await getDb(site);
    const worker = await db.get('SELECT * FROM workers WHERE phone = ?', phone);
    
    if (worker) {
      return NextResponse.json({ success: true, data: worker });
    } else {
      return NextResponse.json({ success: false, message: '등록되지 않은 번호입니다.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
