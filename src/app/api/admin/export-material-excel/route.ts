import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import ExcelJS from 'exceljs';
import path from 'path';

const redis = new Redis(process.env.REDIS_URL || '');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get('site');
    const part = searchParams.get('part');
    const dateParam = searchParams.get('date'); // YYYY-MM-DD or YYYY-MM
    
    if (!site || !part || !dateParam) {
      return new NextResponse('site, part, date 파라미터가 필요합니다.', { status: 400 });
    }

    // 1. DB에서 데이터 불러오기
    const rawRecords = await redis.lrange('material_records', 0, -1);
    let records = rawRecords.map(r => JSON.parse(r));
    
    // 필터링 적용
    records = records.filter(r => 
      r.site === site && 
      r.part === part && 
      r.receiveDate && r.receiveDate.startsWith(dateParam)
    );
    // 시간 순으로 오래된 것부터
    records.reverse();

    if (records.length === 0) {
      return new NextResponse('해당 조건의 자재검수 기록이 없습니다.', { status: 404 });
    }

    // 2. 엑셀 템플릿 로드
    const templatePath = path.join(process.cwd(), 'public/templates/CHM-JT-자재-002-자재검수.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    const templateSheet = workbook.worksheets[0];
    
    // 3. 6개 단위로 쪼개기
    const chunkSize = 6;
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }

    // 4. 각 청크마다 새로운 시트로 만들기
    chunks.forEach((chunk, chunkIndex) => {
      const sheetName = `${chunkIndex + 1}페이지`;
      const ws = chunkIndex === 0 ? templateSheet : workbook.addWorksheet(sheetName);
      if (chunkIndex > 0) ws.name = sheetName; // TODO: 향후 완벽 복제 로직 필요할 수 있음

      // 페이지 전체에 한 번 공통변수 적용
      ws.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          let val = '';
          if (cell.value) {
            if (typeof cell.value === 'string') val = cell.value;
            else if (typeof cell.value === 'object' && (cell.value as any).richText) {
              val = (cell.value as any).richText.map((rt: any) => rt.text).join('');
            } else {
              try { val = cell.value.toString(); } catch(e) {}
            }
          }
          if (!val) return;

          // 공통 변수 치환
          if (val.includes(`{{입고일자}}`) || val.includes(`{{작업내용}}`) || val.includes(`{{직군}}`) || val.includes(`{{페이지}}`)) {
            let replaced = val;
            replaced = replaced.replace(/{{입고일자}}/g, records[0].receiveDate);
            replaced = replaced.replace(/{{작업내용}}/g, '자재 반입 검수');
            replaced = replaced.replace(/{{직군}}/g, part === 'facility' ? '시설' : '미화');
            replaced = replaced.replace(/{{페이지}}/g, `${chunkIndex + 1}/${chunks.length}`);
            cell.value = replaced;
            val = replaced; // 업데이트된 값으로 변경
          }

          // 각 항목 변수 치환 (순번, 물품, 개수, 사진)
          chunk.forEach((record, idx) => {
            const itemNumber = idx + 1; // 1 ~ 6
            if (val.includes(`{{순번}}`) || val.includes(`{{입고 물품}}`)) {
               // Note: 현재 단일 셀에 여러 물품 데이터가 있을 경우 교체 방식 보정이 필요할 수 있음
               // 원본 템플릿이 1,2,3 위치에 고정되어 있다면 정확한 좌표 매핑이 유리합니다.
            }
            if (val.includes(`{%사진${itemNumber}%}`)) {
               cell.value = '';
               if (record.photoBase64) {
                 const base64Data = record.photoBase64.replace(/^data:image\/\w+;base64,/, "");
                 const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                 ws.addImage(imageId, {
                   tl: { col: Number(cell.col) - 1, row: Number(cell.row) - 1 },
                   ext: { width: 140, height: 140 }
                 });
               }
            }
          });
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = encodeURIComponent(`${dateParam}_${site}_${part}_자재검수.xlsx`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Excel Generation Error:', error);
    return new NextResponse('엑셀 생성 중 오류가 발생했습니다.', { status: 500 });
  }
}
